import type { AiProvider } from "./types";

let provider: AiProvider | null = null;

export function setAiProvider(next: AiProvider): void {
  provider = next;
}

export function getAiProvider(): AiProvider {
  if (!provider) {
    throw new Error("AI provider is not configured");
  }
  return provider;
}
