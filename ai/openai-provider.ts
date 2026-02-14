import type { BalanceTarget, GamePackage, ValidationReport } from "@runtime/core/types";

import type { AiProvider, GenerateRequest } from "./types";

export class OpenAiProvider implements AiProvider {
  id = "openai-provider";

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error("OpenAiProvider requires apiKey");
    }
  }

  async generatePackage(request: GenerateRequest): Promise<GamePackage> {
    void request;
    throw new Error("OpenAiProvider.generatePackage is not implemented yet");
  }

  async repairPackage(pkg: GamePackage, diagnostics: ValidationReport): Promise<GamePackage> {
    void pkg;
    void diagnostics;
    throw new Error("OpenAiProvider.repairPackage is not implemented yet");
  }

  async optimizePackage(pkg: GamePackage, target: BalanceTarget): Promise<GamePackage> {
    void pkg;
    void target;
    throw new Error("OpenAiProvider.optimizePackage is not implemented yet");
  }
}
