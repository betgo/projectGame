import type { BalanceTarget, GamePackage, ValidationReport } from "@runtime/core/types";

export type GenerateRequest = {
  prompt: string;
  templateId: string;
};

export type AiProvider = {
  id: string;
  generatePackage(request: GenerateRequest): Promise<GamePackage>;
  repairPackage(pkg: GamePackage, diagnostics: ValidationReport): Promise<GamePackage>;
  optimizePackage(pkg: GamePackage, target: BalanceTarget): Promise<GamePackage>;
};
