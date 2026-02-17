import type { EnemyState, GamePackage, RuntimeWorld, TickResult, Vec2 } from "../../core/types";
import { asEnemyStateById, asRpgPackage, asRpgRuntimeState, type RpgEnemyProfile, type RpgRuntimeState } from "./types";

const NEIGHBOR_OFFSETS: Vec2[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 }
];

function toPointKey(point: Vec2): string {
  return `${point.x},${point.y}`;
}

function isInMap(world: RuntimeWorld, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < world.map.width && y < world.map.height;
}

function isWalkable(world: RuntimeWorld, state: RpgRuntimeState, x: number, y: number): boolean {
  if (!isInMap(world, x, y)) {
    return false;
  }
  return state.walkableTiles.has(world.map.cells[y]?.[x] ?? -1);
}

function createSeedState(seed: number): number {
  const normalized = Math.floor(seed) >>> 0;
  return normalized === 0 ? 1 : normalized;
}

function nextRandom(state: RpgRuntimeState): number {
  state.rngState = (Math.imul(state.rngState, 1664525) + 1013904223) >>> 0;
  return state.rngState / 0x100000000;
}

function pickPatrolTarget(world: RuntimeWorld, state: RpgRuntimeState, spawn: Vec2): Vec2 {
  for (const offset of NEIGHBOR_OFFSETS) {
    const candidate = {
      x: spawn.x + offset.x,
      y: spawn.y + offset.y
    };
    if (isWalkable(world, state, candidate.x, candidate.y)) {
      return candidate;
    }
  }
  return { ...spawn };
}

function collectZoneWalkableCells(
  world: RuntimeWorld,
  state: RpgRuntimeState,
  zone: { x: number; y: number; width: number; height: number }
): Vec2[] {
  const candidates: Vec2[] = [];

  for (let y = zone.y; y < zone.y + zone.height; y += 1) {
    for (let x = zone.x; x < zone.x + zone.width; x += 1) {
      if (!isWalkable(world, state, x, y)) {
        continue;
      }
      candidates.push({ x, y });
    }
  }

  return candidates;
}

function chooseRespawnPosition(world: RuntimeWorld, state: RpgRuntimeState, typeId: string, fallback: Vec2): Vec2 {
  const zones = state.spawnZonesByEnemyType[typeId] ?? [];
  if (zones.length === 0) {
    return { ...fallback };
  }

  const zoneIndex = Math.floor(nextRandom(state) * zones.length);
  const zone = zones[zoneIndex];
  const candidates = collectZoneWalkableCells(world, state, zone);
  if (candidates.length === 0) {
    return { ...fallback };
  }

  const cellIndex = Math.floor(nextRandom(state) * candidates.length);
  const selected = candidates[cellIndex];

  return {
    x: selected.x,
    y: selected.y
  };
}

function findShortestNextStep(
  world: RuntimeWorld,
  state: RpgRuntimeState,
  start: Vec2,
  target: Vec2
): Vec2 | null {
  if (start.x === target.x && start.y === target.y) {
    return null;
  }

  const queue: Vec2[] = [{ x: start.x, y: start.y }];
  const startKey = toPointKey(start);
  const visited = new Set<string>([startKey]);
  const previous = new Map<string, string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const offset of NEIGHBOR_OFFSETS) {
      const next = {
        x: current.x + offset.x,
        y: current.y + offset.y
      };
      const nextKey = toPointKey(next);

      if (visited.has(nextKey)) {
        continue;
      }

      if (!isWalkable(world, state, next.x, next.y)) {
        continue;
      }

      previous.set(nextKey, toPointKey(current));

      if (next.x === target.x && next.y === target.y) {
        let cursor = nextKey;
        let parent = previous.get(cursor);

        while (parent && parent !== startKey) {
          cursor = parent;
          parent = previous.get(cursor);
        }

        const [xRaw, yRaw] = cursor.split(",");
        return {
          x: Number.parseInt(xRaw, 10),
          y: Number.parseInt(yRaw, 10)
        };
      }

      visited.add(nextKey);
      queue.push(next);
    }
  }

  return null;
}

function resolveEnemyProfile(state: RpgRuntimeState, typeId: string): RpgEnemyProfile {
  const profile = state.enemyProfiles[typeId];
  if (!profile) {
    throw new Error(`missing RPG enemy profile: ${typeId}`);
  }
  return profile;
}

function getRuntimeState(world: RuntimeWorld): RpgRuntimeState {
  const internalState = asRpgRuntimeState(world.internal.templateState);
  if (!internalState || typeof internalState !== "object") {
    throw new Error("missing rpg runtime state");
  }
  return internalState;
}

function updateCooldowns(state: RpgRuntimeState, deltaMs: number): void {
  state.player.attackCooldownMs = Math.max(0, state.player.attackCooldownMs - deltaMs);
  state.player.invulnerabilityLeftMs = Math.max(0, state.player.invulnerabilityLeftMs - deltaMs);

  for (const enemyId of state.enemyOrder) {
    const brain = state.enemyBrains[enemyId];
    if (!brain) {
      continue;
    }
    brain.attackCooldownMs = Math.max(0, brain.attackCooldownMs - deltaMs);
  }
}

function manhattanDistance(left: Vec2, right: Vec2): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function choosePlayerTarget(world: RuntimeWorld, state: RpgRuntimeState): Vec2 {
  if (state.objective === "reach-exit") {
    return state.exit;
  }

  const aliveEnemies = world.enemies.filter((enemy) => state.enemyBrains[enemy.instanceId]?.state === "alive");
  if (aliveEnemies.length === 0) {
    return state.exit;
  }

  aliveEnemies.sort((left, right) => {
    const leftDistance = manhattanDistance(state.player, left);
    const rightDistance = manhattanDistance(state.player, right);
    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    return left.instanceId.localeCompare(right.instanceId);
  });

  return {
    x: aliveEnemies[0].x,
    y: aliveEnemies[0].y
  };
}

function movePlayer(world: RuntimeWorld, state: RpgRuntimeState, deltaMs: number): void {
  const moveUnits = (state.player.moveSpeed * deltaMs) / 1000;
  state.player.moveBudget += moveUnits;

  let safety = 0;
  while (state.player.moveBudget >= 1 && safety < 12) {
    const target = choosePlayerTarget(world, state);
    const nextStep = findShortestNextStep(world, state, state.player, target);
    if (!nextStep) {
      break;
    }

    state.player.x = nextStep.x;
    state.player.y = nextStep.y;
    state.player.moveBudget -= 1;
    safety += 1;
  }
}

function chooseEnemyMovementTarget(world: RuntimeWorld, state: RpgRuntimeState, enemy: EnemyState): Vec2 {
  const brain = state.enemyBrains[enemy.instanceId];
  if (!brain) {
    return { x: enemy.x, y: enemy.y };
  }

  const profile = resolveEnemyProfile(state, enemy.typeId);
  const enemyPoint = { x: enemy.x, y: enemy.y };
  const playerPoint = { x: state.player.x, y: state.player.y };

  if (brain.behavior === "chase") {
    return playerPoint;
  }

  if (manhattanDistance(enemyPoint, playerPoint) <= profile.aggroRange) {
    return playerPoint;
  }

  if (brain.behavior === "patrol") {
    if (enemy.x === brain.patrolTarget.x && enemy.y === brain.patrolTarget.y) {
      return brain.spawn;
    }

    if (enemy.x === brain.spawn.x && enemy.y === brain.spawn.y) {
      return brain.patrolTarget;
    }

    return brain.patrolTarget;
  }

  return brain.spawn;
}

function moveEnemies(world: RuntimeWorld, state: RpgRuntimeState, deltaMs: number): void {
  const byId = asEnemyStateById(world.enemies);

  for (const enemyId of state.enemyOrder) {
    const enemy = byId[enemyId];
    if (!enemy) {
      continue;
    }

    const brain = state.enemyBrains[enemyId];
    if (!brain || brain.state !== "alive") {
      continue;
    }

    const profile = resolveEnemyProfile(state, enemy.typeId);
    brain.moveBudget += (profile.moveSpeed * deltaMs) / 1000;

    let safety = 0;
    while (brain.moveBudget >= 1 && safety < 8) {
      const target = chooseEnemyMovementTarget(world, state, enemy);
      const nextStep = findShortestNextStep(world, state, enemy, target);
      if (!nextStep) {
        break;
      }

      enemy.x = nextStep.x;
      enemy.y = nextStep.y;
      brain.moveBudget -= 1;
      safety += 1;
    }
  }
}

function resolvePlayerAttack(world: RuntimeWorld, state: RpgRuntimeState): void {
  if (state.player.attackCooldownMs > 0) {
    return;
  }

  const nearbyEnemies = world.enemies.filter((enemy) => {
    const brain = state.enemyBrains[enemy.instanceId];
    if (!brain || brain.state !== "alive") {
      return false;
    }
    return manhattanDistance(state.player, enemy) <= 1;
  });

  if (nearbyEnemies.length === 0) {
    return;
  }

  nearbyEnemies.sort((left, right) => {
    if (left.hp !== right.hp) {
      return left.hp - right.hp;
    }
    return left.instanceId.localeCompare(right.instanceId);
  });

  const target = nearbyEnemies[0];
  const profile = resolveEnemyProfile(state, target.typeId);
  let damage = Math.max(1, state.player.attack - profile.defense);
  if (nextRandom(state) < state.critChance) {
    damage *= 2;
  }

  target.hp -= damage;
  state.player.attackCooldownMs = state.aiStepMs;
  world.metrics.shotsFired += 1;
  world.metrics.damageDealt += damage;
}

function resolveEnemyAttacks(world: RuntimeWorld, state: RpgRuntimeState): void {
  if (state.player.invulnerabilityLeftMs > 0) {
    return;
  }

  const byId = asEnemyStateById(world.enemies);

  for (const enemyId of state.enemyOrder) {
    const enemy = byId[enemyId];
    if (!enemy) {
      continue;
    }

    const brain = state.enemyBrains[enemyId];
    if (!brain || brain.state !== "alive" || brain.attackCooldownMs > 0) {
      continue;
    }

    if (manhattanDistance(state.player, enemy) > 1) {
      continue;
    }

    const profile = resolveEnemyProfile(state, enemy.typeId);
    const damage = Math.max(1, profile.attack + state.baseContactDamage - state.player.defense);

    state.player.hp -= damage;
    brain.attackCooldownMs = state.aiStepMs;
    state.player.invulnerabilityLeftMs = state.invulnerabilityMs;

    if (state.player.hp <= 0) {
      break;
    }
  }
}

function processEnemyLifecycle(world: RuntimeWorld, state: RpgRuntimeState): void {
  const survivors: EnemyState[] = [];

  for (const enemy of world.enemies) {
    if (enemy.hp > 0) {
      survivors.push(enemy);
      continue;
    }

    const brain = state.enemyBrains[enemy.instanceId];
    if (brain) {
      brain.state = "defeated";
      brain.moveBudget = 0;
      brain.attackCooldownMs = 0;

      if (state.objective === "defeat-all-enemies") {
        brain.respawnAtMs = null;
      } else {
        brain.respawnAtMs = world.elapsedMs + state.respawnDelayMs;
      }
    }

    const profile = resolveEnemyProfile(state, enemy.typeId);
    world.metrics.kills += 1;
    world.metrics.goldEarned += profile.xpReward;
  }

  world.enemies = survivors;
}

function processPlayerLifecycle(world: RuntimeWorld, state: RpgRuntimeState): void {
  if (state.player.hp > 0) {
    world.lives = Math.max(0, state.maxPlayerDeaths - state.player.deaths);
    return;
  }

  state.player.deaths += 1;
  world.metrics.leaks += 1;
  world.lives = Math.max(0, state.maxPlayerDeaths - state.player.deaths);

  if (state.player.deaths > state.maxPlayerDeaths) {
    world.status = "lost";
    state.questState = "failed";
    return;
  }

  state.player.x = state.player.spawn.x;
  state.player.y = state.player.spawn.y;
  state.player.hp = state.player.maxHp;
  state.player.moveBudget = 0;
  state.player.attackCooldownMs = 0;
  state.player.invulnerabilityLeftMs = state.invulnerabilityMs;
}

function processRespawns(world: RuntimeWorld, state: RpgRuntimeState): void {
  if (state.objective === "defeat-all-enemies") {
    return;
  }

  const activeLimit = Math.max(1, state.maxActiveEnemies);
  if (world.enemies.length >= activeLimit) {
    return;
  }

  for (const enemyId of state.enemyOrder) {
    if (world.enemies.length >= activeLimit) {
      break;
    }

    const brain = state.enemyBrains[enemyId];
    if (!brain || brain.state !== "defeated" || brain.respawnAtMs === null) {
      continue;
    }

    if (brain.respawnAtMs > world.elapsedMs) {
      continue;
    }

    const spawn = chooseRespawnPosition(world, state, brain.typeId, brain.spawn);
    const profile = resolveEnemyProfile(state, brain.typeId);

    world.enemies.push({
      instanceId: brain.instanceId,
      typeId: brain.typeId,
      hp: profile.maxHp,
      progress: 0,
      x: spawn.x,
      y: spawn.y
    });

    brain.state = "alive";
    brain.respawnAtMs = null;
    brain.moveBudget = 0;
    brain.attackCooldownMs = 0;
  }
}

function evaluateQuestStatus(world: RuntimeWorld, state: RpgRuntimeState): void {
  if (world.status !== "running") {
    return;
  }

  if (state.objective === "reach-exit") {
    if (state.player.x === state.exit.x && state.player.y === state.exit.y) {
      world.status = "won";
      state.questState = "success";
    }
    return;
  }

  if (state.objective === "defeat-all-enemies") {
    const hasLivingEnemy = state.enemyOrder.some((enemyId) => state.enemyBrains[enemyId]?.state === "alive");
    if (!hasLivingEnemy) {
      world.status = "won";
      state.questState = "success";
    }
    return;
  }

  if (world.elapsedMs >= state.surviveTargetMs) {
    world.status = "won";
    state.questState = "success";
  }
}

function createEnemyProfilesById(payload: ReturnType<typeof asRpgPackage>["rules"]["payload"]): Record<string, RpgEnemyProfile> {
  const profiles: Record<string, RpgEnemyProfile> = {};
  for (const profile of payload.entities.enemies) {
    profiles[profile.id] = { ...profile };
  }
  return profiles;
}

function createSpawnZonesByEnemyType(payload: ReturnType<typeof asRpgPackage>["rules"]["payload"]): Record<string, ReturnType<typeof asRpgPackage>["rules"]["payload"]["map"]["spawnZones"]> {
  const zones: Record<string, ReturnType<typeof asRpgPackage>["rules"]["payload"]["map"]["spawnZones"]> = {};
  for (const zone of payload.map.spawnZones) {
    const items = zones[zone.enemyTypeId] ?? [];
    items.push({ ...zone });
    zones[zone.enemyTypeId] = items;
  }

  for (const key of Object.keys(zones)) {
    zones[key] = [...zones[key]].sort((left, right) => left.id.localeCompare(right.id));
  }

  return zones;
}

function createEnemyBrains(world: RuntimeWorld, state: RpgRuntimeState, pkg: ReturnType<typeof asRpgPackage>): RpgRuntimeState["enemyBrains"] {
  const brains: RpgRuntimeState["enemyBrains"] = {};

  for (const enemy of pkg.entities.enemies) {
    const spawn = { x: enemy.x, y: enemy.y };
    brains[enemy.instanceId] = {
      instanceId: enemy.instanceId,
      typeId: enemy.typeId,
      behavior: enemy.behavior,
      spawn,
      patrolTarget: pickPatrolTarget(world, state, spawn),
      state: "alive",
      moveBudget: 0,
      attackCooldownMs: 0,
      respawnAtMs: null
    };
  }

  return brains;
}

export function createRpgTopdownWorld(pkg: GamePackage, seed: number): RuntimeWorld {
  const rpgPackage = asRpgPackage(pkg);
  const payload = rpgPackage.rules.payload;
  const playerProfile = payload.entities.player;
  const enemyProfiles = createEnemyProfilesById(payload);

  const initialEnemies: EnemyState[] = rpgPackage.entities.enemies.map((enemy) => {
    const profile = enemyProfiles[enemy.typeId];
    if (!profile) {
      throw new Error(`missing RPG enemy profile: ${enemy.typeId}`);
    }

    return {
      instanceId: enemy.instanceId,
      typeId: enemy.typeId,
      hp: profile.maxHp,
      progress: 0,
      x: enemy.x,
      y: enemy.y
    };
  });

  const state: RpgRuntimeState = {
    objective: rpgPackage.winCondition.objective,
    player: {
      id: rpgPackage.entities.player.id,
      x: rpgPackage.entities.player.x,
      y: rpgPackage.entities.player.y,
      spawn: {
        x: rpgPackage.entities.player.x,
        y: rpgPackage.entities.player.y
      },
      hp: playerProfile.maxHp,
      maxHp: playerProfile.maxHp,
      attack: playerProfile.attack,
      defense: playerProfile.defense,
      moveSpeed: playerProfile.moveSpeed,
      moveBudget: 0,
      attackCooldownMs: 0,
      invulnerabilityLeftMs: 0,
      deaths: 0
    },
    enemyBrains: {},
    enemyOrder: rpgPackage.entities.enemies.map((enemy) => enemy.instanceId),
    enemyProfiles,
    spawnZonesByEnemyType: createSpawnZonesByEnemyType(payload),
    walkableTiles: new Set(payload.map.walkableTiles),
    exit: {
      x: payload.map.exit.x,
      y: payload.map.exit.y
    },
    aiStepMs: payload.rules.tick.aiStepMs,
    baseContactDamage: payload.rules.combat.baseContactDamage,
    invulnerabilityMs: payload.rules.combat.invulnerabilityMs,
    critChance: payload.rules.combat.critChance,
    maxActiveEnemies: payload.rules.spawn.maxActiveEnemies,
    respawnDelayMs: payload.rules.spawn.respawnDelayMs,
    maxPlayerDeaths: rpgPackage.winCondition.maxPlayerDeaths,
    surviveTargetMs: Math.max(5000, payload.rules.spawn.respawnDelayMs * payload.rules.spawn.maxActiveEnemies),
    rngState: createSeedState(seed),
    questState: "running"
  };

  const world: RuntimeWorld = {
    templateId: pkg.templateId,
    tick: 0,
    elapsedMs: 0,
    seed,
    status: "running",
    lives: rpgPackage.winCondition.maxPlayerDeaths,
    towers: [],
    enemies: initialEnemies,
    path: [],
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
      spawnQueue: [],
      nextEnemyInstanceId: 1,
      templateState: state
    }
  };

  state.enemyBrains = createEnemyBrains(world, state, rpgPackage);

  return world;
}

export function stepRpgTopdown(world: RuntimeWorld, deltaMs: number): TickResult {
  if (world.status !== "running") {
    return {
      status: world.status,
      tick: world.tick,
      elapsedMs: world.elapsedMs,
      metrics: { ...world.metrics }
    };
  }

  const state = getRuntimeState(world);

  world.tick += 1;
  world.elapsedMs += deltaMs;

  updateCooldowns(state, deltaMs);
  processRespawns(world, state);
  movePlayer(world, state, deltaMs);
  moveEnemies(world, state, deltaMs);
  resolvePlayerAttack(world, state);
  resolveEnemyAttacks(world, state);
  processEnemyLifecycle(world, state);
  processPlayerLifecycle(world, state);
  evaluateQuestStatus(world, state);

  return {
    status: world.status,
    tick: world.tick,
    elapsedMs: world.elapsedMs,
    metrics: { ...world.metrics }
  };
}
