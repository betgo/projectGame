import { describe, expect, it } from "vitest";

import easyPackage from "@game/examples/td-easy.json";
import { validateGamePackage } from "@game/schemas/index";

describe("schema validation", () => {
  it("accepts valid example package", () => {
    const report = validateGamePackage(easyPackage);
    expect(report.valid).toBe(true);
  });

  it("rejects broken package shape", () => {
    const broken = {
      ...easyPackage,
      entities: {
        ...easyPackage.entities,
        towers: [{ id: "t1" }]
      }
    };

    const report = validateGamePackage(broken);
    expect(report.valid).toBe(false);
    expect(report.issues.length).toBeGreaterThan(0);
  });
});
