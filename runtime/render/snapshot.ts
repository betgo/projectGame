import type { RenderSnapshot, RuntimeWorld } from "../core/types";

export function getWorldSnapshot(world: RuntimeWorld): RenderSnapshot {
  return {
    tick: world.tick,
    elapsedMs: world.elapsedMs,
    status: world.status,
    enemies: world.enemies.map((enemy) => ({
      id: enemy.instanceId,
      x: enemy.x,
      y: enemy.y,
      hp: enemy.hp
    })),
    towers: world.towers.map((tower) => ({
      id: tower.id,
      x: tower.x,
      y: tower.y,
      cooldown: tower.cooldownLeftMs
    })),
    metrics: { ...world.metrics }
  };
}
