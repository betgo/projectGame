import { validateGamePackage, type ValidationReport } from "@game/schemas/index";
import type { GamePackage, TowerDefinition } from "../../core/types";

function isInMap(x: number, y: number, width: number, height: number): boolean {
  return x >= 0 && y >= 0 && x < width && y < height;
}

function collectDuplicateIdIssues(
  ids: Array<{ id: string }>,
  pathPrefix: string,
  entityLabel: string
): ValidationReport["issues"] {
  const seen = new Set<string>();
  const issues: ValidationReport["issues"] = [];

  for (const [index, entity] of ids.entries()) {
    if (seen.has(entity.id)) {
      issues.push({
        path: `${pathPrefix}/${index}/id`,
        message: `${entityLabel} id must be unique: ${entity.id}`
      });
      continue;
    }
    seen.add(entity.id);
  }

  return issues;
}

function hasSameTowerStats(left: TowerDefinition, right: TowerDefinition): boolean {
  return (
    left.id === right.id &&
    left.x === right.x &&
    left.y === right.y &&
    left.range === right.range &&
    left.damage === right.damage &&
    left.cooldownMs === right.cooldownMs &&
    left.cost === right.cost
  );
}

export function validateTowerDefensePackage(pkg: GamePackage): ValidationReport {
  const schemaReport = validateGamePackage(pkg);
  if (!schemaReport.valid) {
    return schemaReport;
  }

  const issues = [...schemaReport.issues];
  const { width, height } = pkg.map;
  const { cells } = pkg.map;

  if (cells.length !== height) {
    issues.push({
      path: "/map/cells",
      message: `map cells row count must equal map.height (${height})`
    });
  }

  for (const [rowIndex, row] of cells.entries()) {
    if (row.length !== width) {
      issues.push({
        path: `/map/cells/${rowIndex}`,
        message: `map row width must equal map.width (${width})`
      });
    }
  }

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

  issues.push(
    ...collectDuplicateIdIssues(pkg.entities.towers, "/entities/towers", "tower"),
    ...collectDuplicateIdIssues(pkg.rules.payload.towers, "/rules/payload/towers", "payload tower"),
    ...collectDuplicateIdIssues(pkg.entities.enemies, "/entities/enemies", "enemy"),
    ...collectDuplicateIdIssues(pkg.rules.payload.waves, "/rules/payload/waves", "wave")
  );

  const payloadTowerById = new Map(pkg.rules.payload.towers.map((tower) => [tower.id, tower]));
  for (const [index, tower] of pkg.entities.towers.entries()) {
    const payloadTower = payloadTowerById.get(tower.id);
    if (!payloadTower) {
      issues.push({
        path: `/entities/towers/${index}/id`,
        message: `tower id is missing from payload towers: ${tower.id}`
      });
      continue;
    }
    if (!hasSameTowerStats(tower, payloadTower)) {
      issues.push({
        path: `/rules/payload/towers`,
        message: `payload tower must mirror entities tower definition: ${tower.id}`
      });
    }
  }

  if (pkg.rules.payload.towers.length !== pkg.entities.towers.length) {
    issues.push({
      path: "/rules/payload/towers",
      message: "payload towers must mirror entities.towers length"
    });
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
