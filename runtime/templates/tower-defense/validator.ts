import { validateGamePackage, type ValidationReport } from "@game/schemas/index";
import type { GamePackage } from "../../core/types";

function isInMap(x: number, y: number, width: number, height: number): boolean {
  return x >= 0 && y >= 0 && x < width && y < height;
}

export function validateTowerDefensePackage(pkg: GamePackage): ValidationReport {
  const schemaReport = validateGamePackage(pkg);
  if (!schemaReport.valid) {
    return schemaReport;
  }

  const issues = [...schemaReport.issues];
  const { width, height } = pkg.map;

  for (const [index, point] of pkg.rules.payload.path.entries()) {
    if (!isInMap(point.x, point.y, width, height)) {
      issues.push({
        path: `/rules/payload/path/${index}`,
        message: "path point out of map range"
      });
    }
  }

  for (const [index, tower] of pkg.entities.towers.entries()) {
    if (!isInMap(tower.x, tower.y, width, height)) {
      issues.push({
        path: `/entities/towers/${index}`,
        message: "tower position out of map range"
      });
    }
  }

  const enemyIds = new Set(pkg.entities.enemies.map((enemy) => enemy.id));
  for (const [index, wave] of pkg.rules.payload.waves.entries()) {
    if (!enemyIds.has(wave.enemyId)) {
      issues.push({
        path: `/rules/payload/waves/${index}/enemyId`,
        message: `wave references unknown enemy id: ${wave.enemyId}`
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}
