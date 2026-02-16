import { validateGamePackage } from "@game/schemas/index";
import { runBatch } from "@runtime/core/engine";
import type { BalanceTarget, GamePackage, ValidationReport } from "@runtime/core/types";
import { validateTowerDefensePackage } from "@runtime/templates/tower-defense/validator";

import { getAiProvider, setAiProvider } from "./provider";
import { MockAiProvider } from "./mock-provider";

setAiProvider(new MockAiProvider());
const DEFAULT_MAX_REPAIR_ATTEMPTS = 3;

function mergeReports(schemaReport: ValidationReport, semanticReport: ValidationReport): ValidationReport {
  return {
    valid: schemaReport.valid && semanticReport.valid,
    issues: [...schemaReport.issues, ...semanticReport.issues]
  };
}

function formatValidationIssues(report: ValidationReport, maxItems = 3): string {
  if (report.issues.length === 0) {
    return "unknown validation failure";
  }
  return report.issues
    .slice(0, maxItems)
    .map((issue) => `${issue.path}: ${issue.message}`)
    .join("; ");
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

export async function generateValidateAndRepair(
  prompt: string,
  templateId: string,
  maxRepairAttempts = DEFAULT_MAX_REPAIR_ATTEMPTS
): Promise<GamePackage> {
  if (!Number.isInteger(maxRepairAttempts) || maxRepairAttempts < 0) {
    throw new Error(`invalid maxRepairAttempts: ${maxRepairAttempts}. value must be a non-negative integer`);
  }

  let pkg = await generatePackageFromPrompt(prompt, templateId);

  for (let attempt = 0; attempt <= maxRepairAttempts; attempt += 1) {
    const schemaReport = validateGamePackage(pkg);
    const semanticReport = validateTowerDefensePackage(pkg);
    const merged = mergeReports(schemaReport, semanticReport);

    if (merged.valid) {
      return pkg;
    }

    if (attempt === maxRepairAttempts) {
      const attemptsUsed = maxRepairAttempts + 1;
      throw new Error(
        `AI package failed validation after ${attemptsUsed} attempts: ${formatValidationIssues(merged)}`
      );
    }

    pkg = await repairInvalidPackage(pkg, merged);
  }

  throw new Error("AI package repair loop terminated unexpectedly");
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
