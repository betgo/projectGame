import { validateGamePackage } from "@game/schemas/index";
import { runBatch } from "@runtime/core/engine";
import type { BalanceTarget, GamePackage, ValidationReport } from "@runtime/core/types";
import { validateTowerDefensePackage } from "@runtime/templates/tower-defense/validator";

import { getAiProvider, setAiProvider } from "./provider";
import { MockAiProvider } from "./mock-provider";

setAiProvider(new MockAiProvider());

function mergeReports(schemaReport: ValidationReport, semanticReport: ValidationReport): ValidationReport {
  return {
    valid: schemaReport.valid && semanticReport.valid,
    issues: [...schemaReport.issues, ...semanticReport.issues]
  };
}

export async function generatePackageFromPrompt(prompt: string, templateId: string): Promise<GamePackage> {
  const provider = getAiProvider();
  return provider.generatePackage({ prompt, templateId });
}

export async function repairInvalidPackage(pkg: GamePackage, diagnostics: ValidationReport): Promise<GamePackage> {
  const provider = getAiProvider();
  return provider.repairPackage(pkg, diagnostics);
}

export async function optimizeBalance(pkg: GamePackage, targetMetrics: BalanceTarget): Promise<GamePackage> {
  const provider = getAiProvider();
  return provider.optimizePackage(pkg, targetMetrics);
}

export async function generateValidateAndRepair(prompt: string, templateId: string): Promise<GamePackage> {
  let pkg = await generatePackageFromPrompt(prompt, templateId);

  for (let retry = 0; retry < 3; retry += 1) {
    const schemaReport = validateGamePackage(pkg);
    const semanticReport = validateTowerDefensePackage(pkg);
    const merged = mergeReports(schemaReport, semanticReport);
    if (merged.valid) {
      return pkg;
    }
    pkg = await repairInvalidPackage(pkg, merged);
  }

  return pkg;
}

export async function optimizeWithBatchLoop(pkg: GamePackage, rounds = 3): Promise<GamePackage> {
  let current = pkg;
  for (let i = 0; i < rounds; i += 1) {
    const result = runBatch(current, [1, 2, 3, 4, 5]);
    const target: BalanceTarget = {
      targetWinRate: 0.5,
      maxLeakRate: 3
    };
    if (Math.abs(result.winRate - target.targetWinRate) < 0.1) {
      break;
    }
    current = await optimizeBalance(current, target);
  }
  return current;
}
