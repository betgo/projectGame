import type { GamePackage, RuntimeWorld, SpawnEvent, TowerState } from "./types";

export function buildSpawnQueue(pkg: GamePackage): SpawnEvent[] {
  const queue: SpawnEvent[] = [];
  for (const wave of pkg.rules.payload.waves) {
    for (let i = 0; i < wave.count; i += 1) {
      queue.push({
        enemyId: wave.enemyId,
        atMs: wave.startAtMs + i * wave.intervalMs
      });
    }
  }
  queue.sort((a, b) => a.atMs - b.atMs);
  return queue;
}

export function createBaseWorld(pkg: GamePackage, seed: number): RuntimeWorld {
  const towers: TowerState[] = pkg.entities.towers.map((tower) => ({
    ...tower,
    cooldownLeftMs: 0
  }));

  return {
    templateId: pkg.templateId,
    tick: 0,
    elapsedMs: 0,
    seed,
    status: "running",
    lives: pkg.winCondition.maxLeaks,
    towers,
    enemies: [],
    path: pkg.rules.payload.path,
    map: pkg.map,
    pkg,
    metrics: {
      kills: 0,
      leaks: 0,
      damageDealt: 0,
      shotsFired: 0,
      goldEarned: 0
    },
    internal: {
      spawnQueue: buildSpawnQueue(pkg),
      nextEnemyInstanceId: 1
    }
  };
}
