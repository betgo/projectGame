import { describe, expect, it } from "vitest";

import easyPackage from "@game/examples/td-easy.json";
import { runScenario } from "@runtime/core/engine";

describe("determinism", () => {
  it("returns identical results for same seed", () => {
    const first = runScenario(easyPackage, 7);
    const second = runScenario(easyPackage, 7);

    expect(first).toEqual(second);
  });
});
