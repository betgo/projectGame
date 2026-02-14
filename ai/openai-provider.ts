import type { BalanceTarget, GamePackage, ValidationReport } from "@runtime/core/types";

import type { AiProvider, GenerateRequest } from "./types";

export class OpenAiProvider implements AiProvider {
  id = "openai-provider";

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error("OpenAiProvider requires apiKey");
    }
  }

  async generatePackage(_request: GenerateRequest): Promise<GamePackage> {
    throw new Error("OpenAiProvider.generatePackage is not implemented yet");
  }

  async repairPackage(_pkg: GamePackage, _diagnostics: ValidationReport): Promise<GamePackage> {
    throw new Error("OpenAiProvider.repairPackage is not implemented yet");
  }

  async optimizePackage(_pkg: GamePackage, _target: BalanceTarget): Promise<GamePackage> {
    throw new Error("OpenAiProvider.optimizePackage is not implemented yet");
  }
}
