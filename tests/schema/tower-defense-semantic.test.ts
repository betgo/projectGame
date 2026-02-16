import { describe, expect, it } from "vitest";

import easyPackage from "@game/examples/td-easy.json";
import { validateTowerDefensePackage } from "@runtime/templates/tower-defense/validator";
import type { GamePackage } from "@runtime/core/types";

function cloneFixture(): GamePackage {
  return structuredClone(easyPackage as GamePackage);
}

describe("tower-defense semantic validation hardening", () => {
  it("rejects map cell rows when dimensions drift from width/height", () => {
    const broken = cloneFixture();
    broken.map.cells = broken.map.cells.slice(0, broken.map.height - 1);

    const report = validateTowerDefensePackage(broken);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      path: "/map/cells",
      message: `map cells row count must equal map.height (${broken.map.height})`
    });
  });

  it("rejects duplicated ids and payload/entity tower drift", () => {
    const broken = cloneFixture();
    broken.entities.enemies.push({ ...broken.entities.enemies[0] });
    broken.rules.payload.towers[0] = {
      ...broken.rules.payload.towers[0],
      damage: broken.rules.payload.towers[0].damage + 1
    };

    const report = validateTowerDefensePackage(broken);

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual({
      path: "/entities/enemies/1/id",
      message: `enemy id must be unique: ${broken.entities.enemies[0].id}`
    });
    expect(report.issues).toContainEqual({
      path: "/rules/payload/towers",
      message: `payload tower must mirror entities tower definition: ${broken.entities.towers[0].id}`
    });
  });
});
