import { describe, expect, it } from "vitest";

import { generateValidateAndRepair } from "@ai/pipeline";
import { runScenario } from "@runtime/core/engine";

describe("ai pipeline smoke", () => {
  it("generates a playable package", async () => {
    const pkg = await generateValidateAndRepair("Create a basic lane defense map", "tower-defense");
    const result = runScenario(pkg, 3);

    expect(["defender", "enemy"]).toContain(result.winner);
    expect(result.durationTicks).toBeGreaterThan(0);
  });
});
