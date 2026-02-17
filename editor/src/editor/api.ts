import {
  normalizeGameProjectSchemaVersion,
  validateGamePackage,
  validateGameProject,
  type ValidationIssue,
  type ValidationReport
} from "@game/schemas/index";
import { loadPackage, runBatch, runScenario, step, validateRuntimePackage } from "@runtime/core/engine";
import type {
  BatchResult,
  GamePackage,
  GameProject,
  GameMap,
  MatchResult,
  RuntimeMetrics,
  RuntimeStatus,
  RuntimeWorld,
  TickResult
} from "@runtime/core/types";

import { applyOperation as applyEditorOperationImpl, type EditorOperation, type OpResult } from "./operations";
import { createDefaultProject } from "./store";
import {
  applyTemplateSwitch as applyTemplateSwitchInternal,
  getProjectTemplateId,
  getRpgPayload,
  previewTemplateSwitch as previewTemplateSwitchInternal,
  resolveSupportedTemplateId,
  type SupportedTemplateId,
  type TemplateSwitchPreview as TemplateSwitchPreviewContract,
  type TemplateSwitchResolution as TemplateSwitchResolutionContract
} from "./template-switch";

export type DiagnosticsSeverity = "error" | "warning";
export type DiagnosticsSource =
  | "editor/api"
  | "game/schemas"
  | "runtime/core"
  | "runtime/templates/tower-defense"
  | "runtime/templates/rpg-topdown";
export type DiagnosticsOperation = "import" | "export";

export type ImportExportDiagnostic = {
  code: string;
  path: string;
  message: string;
  hint: string;
  severity: DiagnosticsSeverity;
  source: DiagnosticsSource;
};

export type LoadResult =
  | {
      ok: true;
      project: GameProject;
      report: ValidationReport;
      diagnostics: ImportExportDiagnostic[];
    }
  | {
      ok: false;
      project: GameProject | null;
      report: ValidationReport;
      diagnostics: ImportExportDiagnostic[];
    };

export type ExportDiagnosticsResult = {
  ok: boolean;
  pkg: GamePackage;
  report: ValidationReport;
  diagnostics: ImportExportDiagnostic[];
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

export type TemplateSwitchPreview = TemplateSwitchPreviewContract;
export type TemplateSwitchResolution = TemplateSwitchResolutionContract;

const PREVIEW_MAX_DURATION_MS = 30 * 60 * 1000;
const MAX_DIAGNOSTIC_ISSUES = 3;
const MAX_IMPORT_EXPORT_DIAGNOSTICS = 12;

function joinJsonPointer(parentPath: string, property: string): string {
  if (parentPath === "/") {
    return `/${property}`;
  }
  return `${parentPath}/${property}`;
}

function normalizeSchemaIssuePath(issue: ValidationIssue): string {
  const requiredField = /required property '([^']+)'/.exec(issue.message)?.[1];
  if (requiredField) {
    return joinJsonPointer(issue.path || "/", requiredField);
  }
  return issue.path || "/";
}

function normalizeSemanticIssuePath(issue: ValidationIssue, templateId: string): string {
  const path = issue.path || "/";
  if (path === "/rules/payload") {
    return "/templatePayload";
  }
  if (path.startsWith("/rules/payload/")) {
    return `/templatePayload/${path.slice("/rules/payload/".length)}`;
  }
  if (path === "/version") {
    return "/meta/version";
  }

  if (templateId === "tower-defense") {
    if (path === "/entities/towers") {
      return "/templatePayload/towers";
    }
    if (path.startsWith("/entities/towers/")) {
      return `/templatePayload/towers/${path.slice("/entities/towers/".length)}`;
    }
    if (path.startsWith("/entities/enemies")) {
      return "/templatePayload/spawnRules";
    }
    return path;
  }

  if (templateId === "rpg-topdown") {
    if (path.startsWith("/entities/player")) {
      return "/templatePayload/entities/player";
    }
    if (path.startsWith("/entities/enemies")) {
      return "/templatePayload/map/spawnZones";
    }
    if (path.startsWith("/winCondition")) {
      return "/templatePayload/rules";
    }
    return path;
  }

  return path;
}

function normalizeExportSchemaIssuePath(issue: ValidationIssue, templateId: string): string {
  return normalizeSchemaIssuePath({
    path: normalizeSemanticIssuePath(issue, templateId),
    message: issue.message
  });
}

function cloneIssuesWithPath(
  report: ValidationReport,
  mapPath: (issue: ValidationIssue) => string
): ValidationReport {
  return {
    valid: report.valid,
    issues: report.issues.map((issue) => ({
      path: mapPath(issue),
      message: issue.message
    }))
  };
}

function diagnosticsCode(operation: DiagnosticsOperation, kind: string, detail: string): string {
  return `${operation}.${kind}.${detail}`;
}

function classifySchemaIssue(issue: ValidationIssue): { detail: string; hint: string } {
  const path = issue.path.toLowerCase();
  const message = issue.message.toLowerCase();

  if (path.includes("/meta/version") || message.includes("schema version")) {
    return {
      detail: "version",
      hint: "Use a supported schema version and retry import."
    };
  }
  if (message.includes("required property")) {
    return {
      detail: "required",
      hint: "Add the missing required field and retry."
    };
  }
  if (message.includes("one of the allowed values")) {
    return {
      detail: "enum",
      hint: "Use one of the allowed enum values for this field."
    };
  }
  if (
    message.includes("must be >") ||
    message.includes("must be >=") ||
    message.includes("must be <") ||
    message.includes("must match pattern") ||
    message.includes("must not have fewer than")
  ) {
    return {
      detail: "constraint",
      hint: "Adjust this value to satisfy schema constraints."
    };
  }
  if (message.includes("must be")) {
    return {
      detail: "type",
      hint: "Set this field to the expected data type."
    };
  }
  return {
    detail: "invalid",
    hint: "Fix the schema validation error and retry."
  };
}

function classifySemanticIssue(issue: ValidationIssue): { detail: string; hint: string } {
  const path = issue.path.toLowerCase();
  const message = issue.message.toLowerCase();

  if (message.includes("unknown template")) {
    return {
      detail: "unknown-template",
      hint: "Use a registered templateId and retry."
    };
  }
  if (path.includes("/map/cells")) {
    return {
      detail: "map-shape",
      hint: "Align map.cells dimensions with map.width and map.height."
    };
  }
  if (message.includes("must be unique")) {
    return {
      detail: "duplicate-id",
      hint: "Ensure every id is unique in this list."
    };
  }
  if (message.includes("unknown enemy id")) {
    return {
      detail: "unknown-reference",
      hint: "Set wave.enemyId to an existing enemy definition (for tower-defense use `grunt`)."
    };
  }
  if (message.includes("unknown enemy type") || message.includes("unknown typeid")) {
    return {
      detail: "unknown-reference",
      hint: "Ensure enemy references point to existing payload enemy profiles."
    };
  }
  if (message.includes("out of map range")) {
    return {
      detail: "out-of-range",
      hint: "Keep path/tower positions inside map width and height bounds."
    };
  }
  if (message.includes("must mirror")) {
    return {
      detail: "mirror-mismatch",
      hint: "Keep tower definitions aligned across payload and entities."
    };
  }
  return {
    detail: "invalid",
    hint: "Fix semantic payload mismatches and retry."
  };
}

function semanticDiagnosticsSource(templateId: string): DiagnosticsSource {
  if (templateId === "tower-defense") {
    return "runtime/templates/tower-defense";
  }
  if (templateId === "rpg-topdown") {
    return "runtime/templates/rpg-topdown";
  }
  return "runtime/core";
}

function toSchemaDiagnostics(
  operation: DiagnosticsOperation,
  report: ValidationReport
): ImportExportDiagnostic[] {
  return report.issues.slice(0, MAX_IMPORT_EXPORT_DIAGNOSTICS).map((issue) => {
    const schemaIssue: ValidationIssue = {
      path: issue.path || "/",
      message: issue.message
    };
    const { detail, hint } = classifySchemaIssue(schemaIssue);
    return {
      code: diagnosticsCode(operation, "schema", detail),
      path: schemaIssue.path,
      message: schemaIssue.message,
      hint,
      severity: "error",
      source: "game/schemas"
    };
  });
}

function toSemanticDiagnostics(
  operation: DiagnosticsOperation,
  report: ValidationReport,
  source: DiagnosticsSource
): ImportExportDiagnostic[] {
  return report.issues.slice(0, MAX_IMPORT_EXPORT_DIAGNOSTICS).map((issue) => {
    const semanticIssue: ValidationIssue = {
      path: issue.path || "/",
      message: issue.message
    };
    const { detail, hint } = classifySemanticIssue(semanticIssue);
    return {
      code: diagnosticsCode(operation, "semantic", detail),
      path: semanticIssue.path,
      message: semanticIssue.message,
      hint,
      severity: "error",
      source
    };
  });
}

function parseJsonPosition(message: string): number | null {
  const match = /position (\d+)/.exec(message);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}

function toParseDiagnostics(error: unknown): ImportExportDiagnostic[] {
  const message = errorMessage(error);
  const position = parseJsonPosition(message);
  const hint =
    position === null
      ? "Fix JSON syntax errors and retry import."
      : `Fix JSON syntax near character ${position} and retry import.`;
  return [
    {
      code: diagnosticsCode("import", "parse", "invalid-json"),
      path: "/",
      message,
      hint,
      severity: "error",
      source: "editor/api"
    }
  ];
}

function semanticReportForProject(project: GameProject): ValidationReport {
  const templateId = getProjectTemplateId(project);
  const semanticReport = validateRuntimePackage(exportPackage(project));
  return cloneIssuesWithPath(semanticReport, (issue) => normalizeSemanticIssuePath(issue, templateId));
}

function asProject(value: unknown): GameProject | null {
  if (typeof value === "object" && value !== null) {
    return value as GameProject;
  }
  return null;
}

function loadProjectInternal(payload: unknown): LoadResult {
  const projectCandidate = asProject(payload);
  const schemaReport = validateGameProject(payload);
  if (!schemaReport.valid) {
    const normalizedSchemaReport = cloneIssuesWithPath(schemaReport, (issue) =>
      normalizeSchemaIssuePath(issue)
    );
    return {
      ok: false,
      project: projectCandidate,
      report: normalizedSchemaReport,
      diagnostics: toSchemaDiagnostics("import", normalizedSchemaReport)
    };
  }

  const normalized = normalizeGameProjectSchemaVersion(payload as GameProject);
  if (!normalized.ok) {
    const normalizedVersionReport = cloneIssuesWithPath(
      { valid: false, issues: normalized.issues },
      (issue) => normalizeSchemaIssuePath(issue)
    );
    return {
      ok: false,
      project: projectCandidate,
      report: normalizedVersionReport,
      diagnostics: toSchemaDiagnostics("import", normalizedVersionReport)
    };
  }

  const semanticReport = semanticReportForProject(normalized.value);
  if (!semanticReport.valid) {
    return {
      ok: false,
      project: normalized.value,
      report: semanticReport,
      diagnostics: toSemanticDiagnostics(
        "import",
        semanticReport,
        semanticDiagnosticsSource(normalized.value.templateId)
      )
    };
  }

  return {
    ok: true,
    project: normalized.value,
    report: {
      valid: true,
      issues: []
    },
    diagnostics: []
  };
}

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
    return "Use a registered templateId (tower-defense or rpg-topdown) and retry preview.";
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
  const resolved = resolveSupportedTemplateId(templateId);
  return createDefaultProject(resolved ?? "tower-defense");
}

export function previewTemplateSwitch(
  project: GameProject,
  toTemplateId: SupportedTemplateId
): TemplateSwitchPreview {
  return previewTemplateSwitchInternal(project, toTemplateId);
}

export function applyTemplateSwitch(
  project: GameProject,
  toTemplateId: string,
  force = false
): TemplateSwitchResolution {
  const resolved = resolveSupportedTemplateId(toTemplateId);
  if (!resolved) {
    return {
      fromTemplateId: getProjectTemplateId(project),
      toTemplateId: getProjectTemplateId(project),
      candidate: project,
      warnings: [],
      requiresConfirmation: false,
      applied: false,
      project,
      message: `unsupported template: ${toTemplateId}`
    };
  }
  return applyTemplateSwitchInternal(project, resolved, force);
}

export function loadProject(json: GameProject): LoadResult {
  return loadProjectInternal(json);
}

export function importProjectFromJson(raw: string): LoadResult {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return loadProjectInternal(parsed);
  } catch (error) {
    const diagnostics = toParseDiagnostics(error);
    return {
      ok: false,
      project: null,
      report: {
        valid: false,
        issues: diagnostics.map(({ path, message }) => ({
          path,
          message
        }))
      },
      diagnostics
    };
  }
}

export function applyOperation(project: GameProject, op: EditorOperation): OpResult {
  return applyEditorOperationImpl(project, op);
}

export function validateProject(project: GameProject): ValidationReport {
  return validateGameProject(project);
}

function findFirstWalkableCell(map: GameMap, walkableTiles: Set<number>): { x: number; y: number } {
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      if (walkableTiles.has(map.cells[y]?.[x] ?? -1)) {
        return { x, y };
      }
    }
  }
  return { x: 0, y: 0 };
}

function findWalkableCellInZone(
  map: GameMap,
  walkableTiles: Set<number>,
  zone: { x: number; y: number; width: number; height: number }
): { x: number; y: number } | null {
  for (let y = zone.y; y < zone.y + zone.height; y += 1) {
    for (let x = zone.x; x < zone.x + zone.width; x += 1) {
      if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
        continue;
      }
      if (walkableTiles.has(map.cells[y]?.[x] ?? -1)) {
        return { x, y };
      }
    }
  }
  return null;
}

function exportTowerDefensePackage(project: GameProject): GamePackage {
  return {
    version: project.meta.version,
    templateId: "tower-defense",
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

function exportRpgPackage(project: GameProject): GamePackage {
  const payload = getRpgPayload(project);
  const walkableTiles = new Set(payload.map.walkableTiles);
  const playerSpawn = findFirstWalkableCell(project.map, walkableTiles);
  const behaviors = ["guard", "patrol", "chase"] as const;

  const enemies = payload.map.spawnZones.map((zone, index) => {
    const spawn = findWalkableCellInZone(project.map, walkableTiles, zone) ?? playerSpawn;
    return {
      instanceId: `${zone.enemyTypeId}-${index + 1}`,
      typeId: zone.enemyTypeId,
      x: spawn.x,
      y: spawn.y,
      behavior: behaviors[index % behaviors.length]
    };
  });

  const normalizedEnemies =
    enemies.length > 0
      ? enemies
      : [
          {
            instanceId: "enemy-1",
            typeId: payload.entities.enemies[0]?.id ?? "slime",
            x: playerSpawn.x,
            y: playerSpawn.y,
            behavior: "guard" as const
          }
        ];

  return {
    version: project.meta.version,
    templateId: "rpg-topdown",
    map: project.map,
    entities: {
      player: {
        id: "hero",
        x: playerSpawn.x,
        y: playerSpawn.y,
        profileId: "hero-default"
      },
      enemies: normalizedEnemies
    },
    rules: {
      payload
    },
    winCondition: {
      objective: "reach-exit",
      maxPlayerDeaths: 3
    }
  } as unknown as GamePackage;
}

function tickMsFromPackage(pkg: GamePackage): number {
  const spawnRules = (pkg.rules.payload as Record<string, unknown>).spawnRules;
  if (typeof spawnRules === "object" && spawnRules !== null) {
    const tickMs = (spawnRules as Record<string, unknown>).tickMs;
    if (typeof tickMs === "number" && Number.isFinite(tickMs) && tickMs > 0) {
      return Math.floor(tickMs);
    }
  }

  const rpgRules = (pkg.rules.payload as Record<string, unknown>).rules;
  if (typeof rpgRules === "object" && rpgRules !== null) {
    const tick = (rpgRules as Record<string, unknown>).tick;
    if (typeof tick === "object" && tick !== null) {
      const tickMs = (tick as Record<string, unknown>).tickMs;
      if (typeof tickMs === "number" && Number.isFinite(tickMs) && tickMs > 0) {
        return Math.floor(tickMs);
      }
    }
  }

  return 100;
}

export function exportPackage(project: GameProject): GamePackage {
  if (getProjectTemplateId(project) === "rpg-topdown") {
    return exportRpgPackage(project);
  }
  return exportTowerDefensePackage(project);
}

export function exportPackageWithDiagnostics(project: GameProject): ExportDiagnosticsResult {
  const pkg = exportPackage(project);
  const schemaReport = validateGamePackage(pkg);
  if (!schemaReport.valid) {
    const normalizedSchemaReport = cloneIssuesWithPath(schemaReport, (issue) =>
      normalizeExportSchemaIssuePath(issue, pkg.templateId)
    );
    return {
      ok: false,
      pkg,
      report: normalizedSchemaReport,
      diagnostics: toSchemaDiagnostics("export", normalizedSchemaReport)
    };
  }

  const semanticReport = cloneIssuesWithPath(validateRuntimePackage(pkg), (issue) =>
    normalizeSemanticIssuePath(issue, pkg.templateId)
  );
  if (!semanticReport.valid) {
    return {
      ok: false,
      pkg,
      report: semanticReport,
      diagnostics: toSemanticDiagnostics("export", semanticReport, semanticDiagnosticsSource(pkg.templateId))
    };
  }

  return {
    ok: true,
    pkg,
    report: {
      valid: true,
      issues: []
    },
    diagnostics: []
  };
}

export function startPreview(project: GameProject, seed = 1): PreviewSession {
  const pkg = exportPackage(project);
  const world = loadPackage(pkg, seed);
  const tickMs = tickMsFromPackage(pkg);

  return {
    world,
    tickMs,
    playStep: () => step(world, tickMs),
    runToEnd: () => runScenario(pkg, seed)
  };
}

export function startPreviewDebugSession(project: GameProject, seed = 1): PreviewOverlaySession {
  const pkg = exportPackage(project);
  const tickMs = tickMsFromPackage(pkg);
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
