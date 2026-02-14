import type { BalanceTarget, GamePackage, ValidationReport } from "@runtime/core/types";

import type { AiProvider, GenerateRequest } from "./types";

function hashPrompt(prompt: string): number {
  let hash = 0;
  for (let i = 0; i < prompt.length; i += 1) {
    hash = (hash << 5) - hash + prompt.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildPackage(seed: number): GamePackage {
  const baseHp = 30 + (seed % 20);
  const baseSpeed = 1 + (seed % 3) * 0.2;

  return {
    version: "0.1.0",
    templateId: "tower-defense",
    map: {
      width: 12,
      height: 12,
      cells: Array.from({ length: 12 }, () => Array.from({ length: 12 }, () => 0 as const))
    },
    entities: {
      towers: [
        { id: "t1", x: 3, y: 4, range: 2.6, damage: 8, cooldownMs: 600, cost: 50 },
        { id: "t2", x: 7, y: 6, range: 2.4, damage: 10, cooldownMs: 800, cost: 80 }
      ],
      enemies: [{ id: "grunt", hp: baseHp, speed: baseSpeed, reward: 5 }]
    },
    rules: {
      payload: {
        path: [
          { x: 0, y: 5 },
          { x: 3, y: 5 },
          { x: 6, y: 4 },
          { x: 11, y: 4 }
        ],
        waves: [{ id: "w1", enemyId: "grunt", count: 12, intervalMs: 1000, startAtMs: 0 }],
        towers: [
          { id: "t1", x: 3, y: 4, range: 2.6, damage: 8, cooldownMs: 600, cost: 50 },
          { id: "t2", x: 7, y: 6, range: 2.4, damage: 10, cooldownMs: 800, cost: 80 }
        ],
        economy: {
          startingGold: 120,
          rewardPerKill: 5
        },
        spawnRules: {
          tickMs: 100,
          baseEnemyHp: baseHp,
          baseEnemySpeed: baseSpeed,
          baseEnemyReward: 5
        }
      }
    },
    winCondition: {
      maxLeaks: 5
    }
  };
}

export class MockAiProvider implements AiProvider {
  id = "mock-provider";

  async generatePackage(request: GenerateRequest): Promise<GamePackage> {
    return buildPackage(hashPrompt(`${request.templateId}:${request.prompt}`));
  }

  async repairPackage(pkg: GamePackage, diagnostics: ValidationReport): Promise<GamePackage> {
    if (diagnostics.valid) {
      return pkg;
    }

    const fixed = structuredClone(pkg);
    if (fixed.rules.payload.path.length < 2) {
      fixed.rules.payload.path = [
        { x: 0, y: 0 },
        { x: fixed.map.width - 1, y: fixed.map.height - 1 }
      ];
    }
    if (fixed.rules.payload.waves.length === 0) {
      fixed.rules.payload.waves.push({
        id: "auto-wave",
        enemyId: fixed.entities.enemies[0]?.id ?? "grunt",
        count: 8,
        intervalMs: 1000,
        startAtMs: 0
      });
    }
    return fixed;
  }

  async optimizePackage(pkg: GamePackage, target: BalanceTarget): Promise<GamePackage> {
    const optimized = structuredClone(pkg);
    const enemy = optimized.entities.enemies[0];
    if (!enemy) {
      return optimized;
    }

    if (target.targetWinRate > 0.5) {
      enemy.hp = Math.max(10, enemy.hp - 5);
    } else {
      enemy.hp += 5;
    }

    return optimized;
  }
}
