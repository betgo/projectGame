import { describe, expect, it } from "vitest";

import rpgPackageFixture from "@game/examples/rpg-topdown-mvp.package.json";
import rpgProjectFixture from "@game/examples/rpg-topdown-mvp.project.json";
import tdEasyPackage from "@game/examples/td-easy.json";
import {
  validateGamePackage,
  validateGameProject,
  validateRpgTopdownPayload
} from "@game/schemas/index";

describe("rpg-topdown schema contract", () => {
  it("accepts valid RPG package and project fixtures", () => {
    expect(validateGamePackage(rpgPackageFixture).valid).toBe(true);
    expect(validateGameProject(rpgProjectFixture).valid).toBe(true);
    expect(validateRpgTopdownPayload(rpgPackageFixture.rules.payload).valid).toBe(true);
  });

  it("rejects missing required RPG payload structure fields", () => {
    const broken = structuredClone(rpgPackageFixture) as Record<string, any>;
    delete broken.rules.payload.map.spawnZones;

    const report = validateGamePackage(broken);

    expect(report.valid).toBe(false);
    expect(
      report.issues.some(
        (issue) =>
          issue.path === "/rules/payload/map" && issue.message.includes("required property 'spawnZones'")
      )
    ).toBe(true);
  });

  it("rejects out-of-range RPG baseline combat values", () => {
    const broken = structuredClone(rpgPackageFixture);
    broken.rules.payload.rules.combat.critChance = 1.25;

    const report = validateGamePackage(broken);

    expect(report.valid).toBe(false);
    expect(
      report.issues.some(
        (issue) => issue.path === "/rules/payload/rules/combat/critChance" && issue.message.includes("must be <=")
      )
    ).toBe(true);
  });

  it("rejects RPG project editor tools outside branch enum contract", () => {
    const broken = structuredClone(rpgProjectFixture);
    broken.editorState.selectedTool = "path";

    const report = validateGameProject(broken);

    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.path === "/editorState/selectedTool")).toBe(true);
  });

  it("preserves tower-defense package compatibility while branch mismatch stays invalid", () => {
    const mismatchedTemplate = {
      ...tdEasyPackage,
      templateId: "rpg-topdown"
    };

    expect(validateGamePackage(tdEasyPackage).valid).toBe(true);
    expect(validateGamePackage(mismatchedTemplate).valid).toBe(false);
  });
});
