import { describe, expect, it } from "vitest";

import easyPackage from "@game/examples/td-easy.json";
import { runScenario } from "@runtime/core/engine";
import type { GamePackage } from "@runtime/core/types";

const packageFixture = easyPackage as GamePackage;

describe("determinism", () => {
  it("returns identical results for same seed", () => {
    const first = runScenario(packageFixture, 7);
    const second = runScenario(packageFixture, 7);

    expect(first).toEqual(second);
  });
});
