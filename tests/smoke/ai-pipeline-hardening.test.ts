import { afterEach, describe, expect, it } from "vitest";

import { MockAiProvider } from "@ai/mock-provider";
import { generateValidateAndRepair } from "@ai/pipeline";
import { setAiProvider } from "@ai/provider";
import type { AiProvider } from "@ai/types";
import easyPackage from "@game/examples/td-easy.json";
import type { GamePackage } from "@runtime/core/types";

function buildInvalidPackage(): GamePackage {
  const invalid = structuredClone(easyPackage as GamePackage);
  invalid.rules.payload.path = [];
  invalid.rules.payload.waves = [];
  return invalid;
}

afterEach(() => {
  setAiProvider(new MockAiProvider());
});

describe("ai pipeline hardening", () => {
  it("fails with diagnostics when repairs cannot recover a valid package", async () => {
    const invalid = buildInvalidPackage();
    let repairCalls = 0;

    const provider: AiProvider = {
      id: "always-invalid-provider",
      async generatePackage() {
        return structuredClone(invalid);
      },
      async repairPackage() {
        repairCalls += 1;
        return structuredClone(invalid);
      },
      async optimizePackage(pkg) {
        return pkg;
      }
    };

    setAiProvider(provider);

    await expect(generateValidateAndRepair("keep invalid", "tower-defense", 2)).rejects.toThrow(
      "AI package failed validation after 3 attempts"
    );
    expect(repairCalls).toBe(2);
  });

  it("rejects invalid repair-attempt configuration", async () => {
    await expect(generateValidateAndRepair("invalid config", "tower-defense", -1)).rejects.toThrow(
      "maxRepairAttempts"
    );
  });
});
