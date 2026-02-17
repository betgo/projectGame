import { describe, expect, it } from "vitest";

import rpgPackageFixture from "@game/examples/rpg-topdown-mvp.package.json";
import { loadPackage, runScenario, step, validateRuntimePackage } from "@runtime/core/engine";
import type { GamePackage, RuntimeWorld } from "@runtime/core/types";
import { asRpgPackage } from "@runtime/templates/rpg-topdown/types";

function cloneFixture(): GamePackage {
  return structuredClone(rpgPackageFixture as unknown as GamePackage);
}

function createRespawnProbePackage(): GamePackage {
  const pkg = cloneFixture();
  const rpg = asRpgPackage(pkg);

  rpg.entities.player.x = 1;
  rpg.entities.player.y = 1;
  rpg.entities.enemies = [
    {
      instanceId: "slime-a",
      typeId: "slime",
      x: 2,
      y: 1,
      behavior: "guard"
    }
  ];

  rpg.rules.payload.entities.player.attack = 99;
  rpg.rules.payload.entities.player.defense = 99;
  rpg.rules.payload.entities.player.moveSpeed = 0.01;
  rpg.rules.payload.entities.enemies = [
    {
      id: "slime",
      maxHp: 1,
      attack: 0,
      defense: 0,
      moveSpeed: 0.01,
      aggroRange: 0,
      xpReward: 1
    }
  ];

  rpg.rules.payload.map.spawnZones = [
    {
      id: "mixed-zone",
      x: 6,
      y: 1,
      width: 2,
      height: 2,
      enemyTypeId: "slime"
    }
  ];

  rpg.rules.payload.rules.tick.tickMs = 50;
  rpg.rules.payload.rules.tick.aiStepMs = 50;
  rpg.rules.payload.rules.combat.baseContactDamage = 0;
  rpg.rules.payload.rules.combat.critChance = 0;
  rpg.rules.payload.rules.spawn.maxActiveEnemies = 1;
  rpg.rules.payload.rules.spawn.respawnDelayMs = 100;

  return pkg;
}

function captureFirstRespawnPosition(world: RuntimeWorld, tickMs: number): { x: number; y: number } {
  let sawDefeated = false;

  for (let index = 0; index < 200; index += 1) {
    step(world, tickMs);

    const enemy = world.enemies.find((item) => item.instanceId === "slime-a");
    if (!enemy) {
      sawDefeated = true;
      continue;
    }

    if (sawDefeated) {
      return {
        x: enemy.x,
        y: enemy.y
      };
    }
  }

  throw new Error("expected a deterministic respawn position");
}

describe("rpg runtime minimum systems", () => {
  it("supports reach-exit headless completion and deterministic replay", () => {
    const pkg = cloneFixture();

    const report = validateRuntimePackage(pkg);
    const first = runScenario(pkg, 7);
    const second = runScenario(pkg, 7);

    expect(report).toEqual({ valid: true, issues: [] });
    expect(first).toEqual(second);
    expect(first.winner).toBe("defender");
    expect(first.metrics.kills).toBeGreaterThanOrEqual(0);
  });

  it("supports defeat-all-enemies objective with alive -> defeated lifecycle", () => {
    const pkg = cloneFixture();
    const rpg = asRpgPackage(pkg);

    rpg.winCondition.objective = "defeat-all-enemies";
    rpg.rules.payload.entities.player.attack = 64;
    rpg.rules.payload.entities.player.moveSpeed = 5;
    rpg.rules.payload.rules.combat.critChance = 0;

    const result = runScenario(pkg, 5);

    expect(result.winner).toBe("defender");
    expect(result.metrics.kills).toBe(rpg.entities.enemies.length);
  });

  it("transitions to lost when player deaths exceed maxPlayerDeaths", () => {
    const pkg = cloneFixture();
    const rpg = asRpgPackage(pkg);

    rpg.winCondition.objective = "defeat-all-enemies";
    rpg.winCondition.maxPlayerDeaths = 0;
    rpg.entities.player.x = 6;
    rpg.entities.player.y = 2;
    rpg.entities.enemies = [
      {
        instanceId: "slime-a",
        typeId: "slime",
        x: 6,
        y: 2,
        behavior: "chase"
      }
    ];

    rpg.rules.payload.entities.player.maxHp = 20;
    rpg.rules.payload.entities.player.attack = 1;
    rpg.rules.payload.entities.player.defense = 0;
    rpg.rules.payload.entities.player.moveSpeed = 0.01;
    rpg.rules.payload.entities.enemies = [
      {
        id: "slime",
        maxHp: 300,
        attack: 25,
        defense: 10,
        moveSpeed: 3,
        aggroRange: 6,
        xpReward: 0
      }
    ];

    rpg.rules.payload.rules.combat.baseContactDamage = 12;
    rpg.rules.payload.rules.combat.invulnerabilityMs = 50;
    rpg.rules.payload.rules.combat.critChance = 0;

    const result = runScenario(pkg, 9);

    expect(result.winner).toBe("enemy");
    expect(result.metrics.leaks).toBeGreaterThanOrEqual(1);
  });

  it("keeps respawn spawn-zone selection deterministic and walkable", () => {
    const pkg = createRespawnProbePackage();
    const rpg = asRpgPackage(pkg);
    const tickMs = rpg.rules.payload.rules.tick.tickMs;
    const walkableTiles = new Set(rpg.rules.payload.map.walkableTiles);

    const worldA = loadPackage(pkg, 11);
    const worldB = loadPackage(pkg, 11);

    const firstRespawnA = captureFirstRespawnPosition(worldA, tickMs);
    const firstRespawnB = captureFirstRespawnPosition(worldB, tickMs);

    expect(firstRespawnA).toEqual(firstRespawnB);
    expect(walkableTiles.has(pkg.map.cells[firstRespawnA.y]?.[firstRespawnA.x] ?? -1)).toBe(true);

    const zone = rpg.rules.payload.map.spawnZones[0];
    expect(firstRespawnA.x).toBeGreaterThanOrEqual(zone.x);
    expect(firstRespawnA.x).toBeLessThan(zone.x + zone.width);
    expect(firstRespawnA.y).toBeGreaterThanOrEqual(zone.y);
    expect(firstRespawnA.y).toBeLessThan(zone.y + zone.height);
  });

  it("rejects blocked player spawn and unreachable reach-exit objectives", () => {
    const pkg = cloneFixture();
    const rpg = asRpgPackage(pkg);

    rpg.rules.payload.map.walkableTiles = [2];

    const report = validateRuntimePackage(pkg);

    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.path === "/entities/player")).toBe(true);
    expect(report.issues.some((issue) => issue.path === "/winCondition/objective")).toBe(true);
  });
});
