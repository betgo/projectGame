import { validateGamePackage, type ValidationReport } from "@game/schemas/index";
import type { GamePackage, Vec2 } from "../../core/types";
import { asRpgPackage } from "./types";

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

function collectDuplicateStringIssues(
  values: string[],
  pathPrefix: string,
  label: string
): ValidationReport["issues"] {
  const seen = new Set<string>();
  const issues: ValidationReport["issues"] = [];

  for (const [index, value] of values.entries()) {
    if (seen.has(value)) {
      issues.push({
        path: `${pathPrefix}/${index}`,
        message: `${label} must be unique: ${value}`
      });
      continue;
    }
    seen.add(value);
  }

  return issues;
}

function isWalkableTile(pkg: GamePackage, walkableTiles: Set<number>, x: number, y: number): boolean {
  if (!isInMap(x, y, pkg.map.width, pkg.map.height)) {
    return false;
  }

  return walkableTiles.has(pkg.map.cells[y]?.[x] ?? -1);
}

function hasReachablePath(
  pkg: GamePackage,
  walkableTiles: Set<number>,
  start: Vec2,
  target: Vec2
): boolean {
  if (start.x === target.x && start.y === target.y) {
    return true;
  }

  const width = pkg.map.width;
  const height = pkg.map.height;
  const queue: Vec2[] = [{ x: start.x, y: start.y }];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const neighbors: Vec2[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 }
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const neighbor of neighbors) {
      const next = {
        x: current.x + neighbor.x,
        y: current.y + neighbor.y
      };
      const key = `${next.x},${next.y}`;

      if (visited.has(key)) {
        continue;
      }

      if (!isInMap(next.x, next.y, width, height)) {
        continue;
      }

      if (!walkableTiles.has(pkg.map.cells[next.y]?.[next.x] ?? -1)) {
        continue;
      }

      if (next.x === target.x && next.y === target.y) {
        return true;
      }

      visited.add(key);
      queue.push(next);
    }
  }

  return false;
}

function zoneContainsWalkableCell(
  pkg: GamePackage,
  walkableTiles: Set<number>,
  zone: { x: number; y: number; width: number; height: number }
): boolean {
  for (let y = zone.y; y < zone.y + zone.height; y += 1) {
    for (let x = zone.x; x < zone.x + zone.width; x += 1) {
      if (isWalkableTile(pkg, walkableTiles, x, y)) {
        return true;
      }
    }
  }
  return false;
}

export function validateRpgTopdownPackage(pkg: GamePackage): ValidationReport {
  const schemaReport = validateGamePackage(pkg);
  if (!schemaReport.valid) {
    return schemaReport;
  }

  const rpgPackage = asRpgPackage(pkg);
  const issues = [...schemaReport.issues];
  const { width, height } = pkg.map;
  const walkableTiles = new Set(rpgPackage.rules.payload.map.walkableTiles);
  const enemyProfiles = rpgPackage.rules.payload.entities.enemies;
  const enemyProfileById = new Map(enemyProfiles.map((enemy) => [enemy.id, enemy]));

  if (pkg.map.cells.length !== height) {
    issues.push({
      path: "/map/cells",
      message: `map cells row count must equal map.height (${height})`
    });
  }

  for (const [rowIndex, row] of pkg.map.cells.entries()) {
    if (row.length !== width) {
      issues.push({
        path: `/map/cells/${rowIndex}`,
        message: `map row width must equal map.width (${width})`
      });
    }
  }

  const player = rpgPackage.entities.player;
  const exit = rpgPackage.rules.payload.map.exit;

  if (!isInMap(player.x, player.y, width, height)) {
    issues.push({
      path: "/entities/player",
      message: "player position out of map range"
    });
  } else if (!isWalkableTile(pkg, walkableTiles, player.x, player.y)) {
    issues.push({
      path: "/entities/player",
      message: "player position must be on a walkable tile"
    });
  }

  if (!isInMap(exit.x, exit.y, width, height)) {
    issues.push({
      path: "/rules/payload/map/exit",
      message: "exit position out of map range"
    });
  } else if (!isWalkableTile(pkg, walkableTiles, exit.x, exit.y)) {
    issues.push({
      path: "/rules/payload/map/exit",
      message: "exit position must be on a walkable tile"
    });
  }

  issues.push(
    ...collectDuplicateIdIssues(enemyProfiles, "/rules/payload/entities/enemies", "enemy profile"),
    ...collectDuplicateIdIssues(rpgPackage.rules.payload.map.spawnZones, "/rules/payload/map/spawnZones", "spawn zone"),
    ...collectDuplicateStringIssues(
      rpgPackage.entities.enemies.map((enemy) => enemy.instanceId),
      "/entities/enemies",
      "enemy instanceId"
    )
  );

  for (const [index, enemy] of rpgPackage.entities.enemies.entries()) {
    if (!enemyProfileById.has(enemy.typeId)) {
      issues.push({
        path: `/entities/enemies/${index}/typeId`,
        message: `enemy references unknown typeId: ${enemy.typeId}`
      });
    }

    if (!isInMap(enemy.x, enemy.y, width, height)) {
      issues.push({
        path: `/entities/enemies/${index}`,
        message: "enemy position out of map range"
      });
      continue;
    }

    if (!isWalkableTile(pkg, walkableTiles, enemy.x, enemy.y)) {
      issues.push({
        path: `/entities/enemies/${index}`,
        message: "enemy position must be on a walkable tile"
      });
    }
  }

  for (const [index, zone] of rpgPackage.rules.payload.map.spawnZones.entries()) {
    const zoneRight = zone.x + zone.width;
    const zoneBottom = zone.y + zone.height;
    if (!isInMap(zone.x, zone.y, width, height) || zoneRight > width || zoneBottom > height) {
      issues.push({
        path: `/rules/payload/map/spawnZones/${index}`,
        message: "spawn zone must stay within map bounds"
      });
      continue;
    }

    if (!enemyProfileById.has(zone.enemyTypeId)) {
      issues.push({
        path: `/rules/payload/map/spawnZones/${index}/enemyTypeId`,
        message: `spawn zone references unknown enemy type: ${zone.enemyTypeId}`
      });
    }

    if (!zoneContainsWalkableCell(pkg, walkableTiles, zone)) {
      issues.push({
        path: `/rules/payload/map/spawnZones/${index}`,
        message: "spawn zone must include at least one walkable tile"
      });
    }
  }

  if (
    rpgPackage.winCondition.objective === "reach-exit" &&
    isInMap(player.x, player.y, width, height) &&
    isInMap(exit.x, exit.y, width, height) &&
    !hasReachablePath(pkg, walkableTiles, { x: player.x, y: player.y }, exit)
  ) {
    issues.push({
      path: "/winCondition/objective",
      message: "reach-exit objective requires a walkable path from player spawn to exit"
    });
  }

  return {
    valid: issues.length === 0,
    issues
  };
}
