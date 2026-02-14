import { validateGameProject, type ValidationReport } from "@game/schemas/index";
import { loadPackage, runBatch, runScenario, step } from "@runtime/core/engine";
import type { BatchResult, GamePackage, GameProject, MatchResult, RuntimeWorld } from "@runtime/core/types";

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

export function createProject(templateId: string): GameProject {
  const project = createDefaultProject();
  project.templateId = templateId;
  return project;
}

export function loadProject(json: GameProject): LoadResult {
  const report = validateGameProject(json);
  return {
    ok: report.valid,
    project: json,
    report
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

export function runProjectBatch(project: GameProject, seeds: number[]): BatchResult {
  const pkg = exportPackage(project);
  return runBatch(pkg, seeds);
}
