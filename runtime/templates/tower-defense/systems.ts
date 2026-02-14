import type { EnemyDefinition, EnemyState, RuntimeWorld, TickResult } from "../../core/types";

function distanceSquared(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

function interpolatePath(path: RuntimeWorld["path"], progress: number): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(progress, path.length - 1));
  const index = Math.floor(clamped);
  const next = Math.min(index + 1, path.length - 1);
  const ratio = clamped - index;
  const p1 = path[index];
  const p2 = path[next];
  return {
    x: p1.x + (p2.x - p1.x) * ratio,
    y: p1.y + (p2.y - p1.y) * ratio
  };
}

function findEnemyDef(world: RuntimeWorld, enemyId: string): EnemyDefinition {
  const found = world.pkg.entities.enemies.find((enemy) => enemy.id === enemyId);
  if (!found) {
    throw new Error(`missing enemy definition: ${enemyId}`);
  }
  return found;
}

function spawnEnemies(world: RuntimeWorld): void {
  while (world.internal.spawnQueue.length > 0 && world.internal.spawnQueue[0].atMs <= world.elapsedMs) {
    const event = world.internal.spawnQueue.shift();
    if (!event) {
      break;
    }
    const def = findEnemyDef(world, event.enemyId);
    const firstPoint = world.path[0];
    const enemy: EnemyState = {
      instanceId: `enemy-${world.internal.nextEnemyInstanceId}`,
      typeId: def.id,
      hp: def.hp,
      progress: 0,
      x: firstPoint.x,
      y: firstPoint.y
    };
    world.internal.nextEnemyInstanceId += 1;
    world.enemies.push(enemy);
  }
}

function moveEnemies(world: RuntimeWorld, deltaMs: number): void {
  const seconds = deltaMs / 1000;
  const pathLength = Math.max(1, world.path.length - 1);
  for (const enemy of world.enemies) {
    const def = findEnemyDef(world, enemy.typeId);
    enemy.progress += (def.speed * seconds) / pathLength;
    const pos = interpolatePath(world.path, enemy.progress * pathLength);
    enemy.x = pos.x;
    enemy.y = pos.y;
  }
}

function towerAttack(world: RuntimeWorld, deltaMs: number): void {
  for (const tower of world.towers) {
    tower.cooldownLeftMs = Math.max(0, tower.cooldownLeftMs - deltaMs);
    if (tower.cooldownLeftMs > 0) {
      continue;
    }

    const rangeSq = tower.range * tower.range;
    let target: EnemyState | undefined;
    for (const enemy of world.enemies) {
      if (enemy.hp <= 0) {
        continue;
      }
      if (distanceSquared(tower.x, tower.y, enemy.x, enemy.y) <= rangeSq) {
        if (!target || enemy.progress > target.progress) {
          target = enemy;
        }
      }
    }

    if (!target) {
      continue;
    }

    target.hp -= tower.damage;
    tower.cooldownLeftMs = tower.cooldownMs;
    world.metrics.shotsFired += 1;
    world.metrics.damageDealt += tower.damage;
  }
}

function resolveDeathsAndLeaks(world: RuntimeWorld): void {
  const survivors: EnemyState[] = [];

  for (const enemy of world.enemies) {
    if (enemy.hp <= 0) {
      const def = findEnemyDef(world, enemy.typeId);
      world.metrics.kills += 1;
      world.metrics.goldEarned += def.reward;
      continue;
    }
    if (enemy.progress >= 1) {
      world.metrics.leaks += 1;
      world.lives -= 1;
      continue;
    }
    survivors.push(enemy);
  }

  world.enemies = survivors;
}

export function stepTowerDefense(world: RuntimeWorld, deltaMs: number): TickResult {
  if (world.status !== "running") {
    return {
      status: world.status,
      tick: world.tick,
      elapsedMs: world.elapsedMs,
      metrics: { ...world.metrics }
    };
  }

  world.tick += 1;
  world.elapsedMs += deltaMs;

  spawnEnemies(world);
  moveEnemies(world, deltaMs);
  towerAttack(world, deltaMs);
  resolveDeathsAndLeaks(world);

  if (world.lives <= 0) {
    world.status = "lost";
  } else if (world.internal.spawnQueue.length === 0 && world.enemies.length === 0) {
    world.status = "won";
  }

  return {
    status: world.status,
    tick: world.tick,
    elapsedMs: world.elapsedMs,
    metrics: { ...world.metrics }
  };
}
