import {
  normalizeGameProjectSchemaVersion,
  validateGameProject,
  type ValidationIssue,
  type ValidationReport
} from "@game/schemas/index";
import { loadPackage, runBatch, runScenario, step } from "@runtime/core/engine";
import type {
  BatchResult,
  GamePackage,
  GameProject,
  MatchResult,
  RuntimeMetrics,
  RuntimeStatus,
  RuntimeWorld,
  TickResult
} from "@runtime/core/types";

import { applyOperation as applyEditorOperationImpl, type EditorOperation, type OpResult } from "./operations";
import { createDefaultProject } from "./store";

export type LoadResult = {
  ok: boolean;
  project: GameProject;
  report: ValidationReport;
};

export type PreviewSession = {
  world: RuntimeWorld;
  tickMs: number;
  playStep: () => ReturnType<typeof step>;
  runToEnd: () => MatchResult;
};

export type PreviewOverlayStatus = RuntimeStatus | "error";

export type PreviewOverlayDiagnostics = {
  tick: number;
  elapsedMs: number;
  tickMs: number;
  seed: number;
  status: PreviewOverlayStatus;
  lives: number;
  activeEnemies: number;
  activeTowers: number;
  pendingSpawns: number;
  metrics: RuntimeMetrics;
};

export type PreviewErrorDiagnostic = {
  phase: "validation" | "runtime";
  summary: string;
  issues: ValidationIssue[];
  hints: string[];
};

export type PreviewOverlayState = {
  action: "init" | "step" | "fast" | "full";
  diagnostics: PreviewOverlayDiagnostics;
  error: PreviewErrorDiagnostic | null;
};

export type PreviewOverlaySession = {
  world: RuntimeWorld | null;
  tickMs: number;
  getState: () => PreviewOverlayState;
  playStep: () => TickResult | null;
  playFast: (loops: number) => TickResult | null;
  runToEnd: () => MatchResult | null;
};

const PREVIEW_MAX_DURATION_MS = 30 * 60 * 1000;
const MAX_DIAGNOSTIC_ISSUES = 3;

function cloneMetrics(metrics: RuntimeMetrics): RuntimeMetrics {
  return {
    kills: metrics.kills,
    leaks: metrics.leaks,
    damageDealt: metrics.damageDealt,
    shotsFired: metrics.shotsFired,
    goldEarned: metrics.goldEarned
  };
}

function createOverlayDiagnostics(world: RuntimeWorld, tickMs: number): PreviewOverlayDiagnostics {
  return {
    tick: world.tick,
    elapsedMs: world.elapsedMs,
    tickMs,
    seed: world.seed,
    status: world.status,
    lives: world.lives,
    activeEnemies: world.enemies.length,
    activeTowers: world.towers.length,
    pendingSpawns: world.internal.spawnQueue.length,
    metrics: cloneMetrics(world.metrics)
  };
}

function createFallbackDiagnostics(seed: number, tickMs: number): PreviewOverlayDiagnostics {
  return {
    tick: 0,
    elapsedMs: 0,
    tickMs,
    seed,
    status: "error",
    lives: 0,
    activeEnemies: 0,
    activeTowers: 0,
    pendingSpawns: 0,
    metrics: {
      kills: 0,
      leaks: 0,
      damageDealt: 0,
      shotsFired: 0,
      goldEarned: 0
    }
  };
}

function dedupeHints(hints: string[]): string[] {
  const uniqueHints: string[] = [];
  const seen = new Set<string>();
  for (const hint of hints) {
    if (!hint || seen.has(hint)) {
      continue;
    }
    seen.add(hint);
    uniqueHints.push(hint);
  }
  return uniqueHints;
}

function hintForValidationIssue(issue: ValidationIssue): string {
  const path = issue.path.toLowerCase();
  if (path.includes("/templatepayload/path")) {
    return "Add at least 2 valid path nodes inside map bounds before running preview.";
  }
  if (path.includes("/templatepayload/waves")) {
    return "Add at least 1 wave entry with count >= 1 and intervalMs >= 50.";
  }
  if (path.includes("/map/cells")) {
    return "Keep map.cells dimensions aligned with map.width and map.height.";
  }
  if (path.includes("/editorstate/speed")) {
    return "Set preview speed in the range 0.5 to 8.";
  }
  return "Fix the reported field and retry preview reset.";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function hintForRuntimeError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("unknown template")) {
    return "Use a registered templateId (currently tower-defense) and retry preview.";
  }
  if (normalized.includes("invalid game package")) {
    return "Fix package validation issues, then reset preview.";
  }
  if (normalized.includes("missing enemy definition")) {
    return "Ensure every wave.enemyId maps to an existing enemy definition.";
  }
  if (normalized.includes("invalid seed")) {
    return "Use a positive integer seed for preview reset.";
  }
  return "Reset preview after fixing data. If it persists, inspect runtime logs.";
}

function createValidationError(report: ValidationReport): PreviewErrorDiagnostic {
  const issues = report.issues.slice(0, MAX_DIAGNOSTIC_ISSUES);
  const hints = dedupeHints(issues.map(hintForValidationIssue));
  return {
    phase: "validation",
    summary: `preview validation failed (${report.issues.length} issue${report.issues.length === 1 ? "" : "s"})`,
    issues,
    hints: hints.length > 0 ? hints : ["Fix validation issues and retry preview reset."]
  };
}

function createRuntimeError(error: unknown): PreviewErrorDiagnostic {
  const message = errorMessage(error);
  return {
    phase: "runtime",
    summary: `preview runtime failed: ${message}`,
    issues: [{ path: "/runtime", message }],
    hints: [hintForRuntimeError(message)]
  };
}

function toMatchResult(world: RuntimeWorld): MatchResult {
  return {
    winner: world.status === "won" ? "defender" : "enemy",
    durationTicks: world.tick,
    durationMs: world.elapsedMs,
    seed: world.seed,
    metrics: cloneMetrics(world.metrics)
  };
}

export function createProject(templateId: string): GameProject {
  const project = createDefaultProject();
  project.templateId = templateId;
  return project;
}

export function loadProject(json: GameProject): LoadResult {
  const schemaReport = validateGameProject(json);
  if (!schemaReport.valid) {
    return {
      ok: false,
      project: json,
      report: schemaReport
    };
  }

  const normalized = normalizeGameProjectSchemaVersion(json);
  if (!normalized.ok) {
    return {
      ok: false,
      project: json,
      report: {
        valid: false,
        issues: normalized.issues
      }
    };
  }

  return {
    ok: true,
    project: normalized.value,
    report: {
      valid: true,
      issues: []
    }
  };
}

export function applyOperation(project: GameProject, op: EditorOperation): OpResult {
  return applyEditorOperationImpl(project, op);
}

export function validateProject(project: GameProject): ValidationReport {
  return validateGameProject(project);
}

export function exportPackage(project: GameProject): GamePackage {
  return {
    version: project.meta.version,
    templateId: project.templateId,
    map: project.map,
    entities: {
      towers: project.templatePayload.towers,
      enemies: [
        {
          id: "grunt",
          hp: project.templatePayload.spawnRules.baseEnemyHp,
          speed: project.templatePayload.spawnRules.baseEnemySpeed,
          reward: project.templatePayload.spawnRules.baseEnemyReward
        }
      ]
    },
    rules: {
      payload: project.templatePayload
    },
    winCondition: {
      maxLeaks: Math.max(1, Math.floor(project.templatePayload.economy.startingGold / 20))
    }
  };
}

export function startPreview(project: GameProject, seed = 1): PreviewSession {
  const pkg = exportPackage(project);
  const world = loadPackage(pkg, seed);

  return {
    world,
    tickMs: pkg.rules.payload.spawnRules.tickMs,
    playStep: () => step(world, pkg.rules.payload.spawnRules.tickMs),
    runToEnd: () => runScenario(pkg, seed)
  };
}

export function startPreviewDebugSession(project: GameProject, seed = 1): PreviewOverlaySession {
  const pkg = exportPackage(project);
  const tickMs = pkg.rules.payload.spawnRules.tickMs;
  const projectReport = validateProject(project);
  let world: RuntimeWorld | null = null;
  let state: PreviewOverlayState;

  if (!projectReport.valid) {
    state = {
      action: "init",
      diagnostics: createFallbackDiagnostics(seed, tickMs),
      error: createValidationError(projectReport)
    };
  } else {
    try {
      world = loadPackage(pkg, seed);
      state = {
        action: "init",
        diagnostics: createOverlayDiagnostics(world, tickMs),
        error: null
      };
    } catch (error) {
      state = {
        action: "init",
        diagnostics: createFallbackDiagnostics(seed, tickMs),
        error: createRuntimeError(error)
      };
    }
  }

  const markActionWithoutStep = (action: PreviewOverlayState["action"]): null => {
    state = {
      ...state,
      action
    };
    return null;
  };

  const markRuntimeFailure = (action: PreviewOverlayState["action"], error: unknown): null => {
    if (world) {
      state = {
        action,
        diagnostics: {
          ...createOverlayDiagnostics(world, tickMs),
          status: "error"
        },
        error: createRuntimeError(error)
      };
      return null;
    }

    state = {
      action,
      diagnostics: createFallbackDiagnostics(seed, tickMs),
      error: createRuntimeError(error)
    };
    return null;
  };

  return {
    world,
    tickMs,
    getState: () => state,
    playStep: () => {
      if (!world) {
        return markActionWithoutStep("step");
      }
      try {
        const result = step(world, tickMs);
        state = {
          action: "step",
          diagnostics: createOverlayDiagnostics(world, tickMs),
          error: null
        };
        return result;
      } catch (error) {
        return markRuntimeFailure("step", error);
      }
    },
    playFast: (loops: number) => {
      if (!world) {
        return markActionWithoutStep("fast");
      }

      const runLoops = Math.max(1, Math.floor(loops));

      try {
        let result: TickResult = step(world, tickMs);
        for (let index = 1; index < runLoops; index += 1) {
          if (result.status !== "running") {
            break;
          }
          result = step(world, tickMs);
        }
        state = {
          action: "fast",
          diagnostics: createOverlayDiagnostics(world, tickMs),
          error: null
        };
        return result;
      } catch (error) {
        return markRuntimeFailure("fast", error);
      }
    },
    runToEnd: () => {
      if (!world) {
        return markActionWithoutStep("full");
      }

      const maxTicks = Math.max(1, Math.floor(PREVIEW_MAX_DURATION_MS / tickMs));

      try {
        for (let index = 0; index < maxTicks; index += 1) {
          if (world.status !== "running") {
            break;
          }
          step(world, tickMs);
        }

        if (world.status === "running") {
          world.status = "lost";
        }

        state = {
          action: "full",
          diagnostics: createOverlayDiagnostics(world, tickMs),
          error: null
        };
        return toMatchResult(world);
      } catch (error) {
        return markRuntimeFailure("full", error);
      }
    }
  };
}

export function runProjectBatch(project: GameProject, seeds: number[]): BatchResult {
  const pkg = exportPackage(project);
  return runBatch(pkg, seeds);
}
