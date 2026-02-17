import type { EnemyState, GamePackage, GameMap, Vec2 } from "../../core/types";

export type RpgObjective = "reach-exit" | "defeat-all-enemies" | "survive-duration";
export type RpgEnemyBehavior = "patrol" | "guard" | "chase";
export type RpgEnemyLifecycle = "alive" | "defeated";

export type RpgPlayerProfile = {
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
};

export type RpgEnemyProfile = {
  id: string;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  aggroRange: number;
  xpReward: number;
};

export type RpgSpawnZone = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  enemyTypeId: string;
};

export type RpgTopdownPayload = {
  map: {
    walkableTiles: number[];
    spawnZones: RpgSpawnZone[];
    exit: Vec2;
  };
  entities: {
    player: RpgPlayerProfile;
    enemies: RpgEnemyProfile[];
  };
  rules: {
    tick: {
      tickMs: number;
      aiStepMs: number;
    };
    combat: {
      baseContactDamage: number;
      invulnerabilityMs: number;
      critChance: number;
    };
    spawn: {
      maxActiveEnemies: number;
      respawnDelayMs: number;
    };
  };
};

export type RpgTopdownPackage = Omit<GamePackage, "entities" | "rules" | "winCondition"> & {
  templateId: "rpg-topdown";
  map: GameMap;
  entities: {
    player: {
      id: string;
      x: number;
      y: number;
      profileId: string;
    };
    enemies: Array<{
      instanceId: string;
      typeId: string;
      x: number;
      y: number;
      behavior: RpgEnemyBehavior;
    }>;
  };
  rules: {
    payload: RpgTopdownPayload;
  };
  winCondition: {
    objective: RpgObjective;
    maxPlayerDeaths: number;
  };
};

export type RpgPlayerState = {
  id: string;
  x: number;
  y: number;
  spawn: Vec2;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  moveBudget: number;
  attackCooldownMs: number;
  invulnerabilityLeftMs: number;
  deaths: number;
};

export type RpgEnemyBrain = {
  instanceId: string;
  typeId: string;
  behavior: RpgEnemyBehavior;
  spawn: Vec2;
  patrolTarget: Vec2;
  state: RpgEnemyLifecycle;
  moveBudget: number;
  attackCooldownMs: number;
  respawnAtMs: number | null;
};

export type RpgRuntimeQuestState = "running" | "success" | "failed";

export type RpgRuntimeState = {
  objective: RpgObjective;
  player: RpgPlayerState;
  enemyBrains: Record<string, RpgEnemyBrain>;
  enemyOrder: string[];
  enemyProfiles: Record<string, RpgEnemyProfile>;
  spawnZonesByEnemyType: Record<string, RpgSpawnZone[]>;
  walkableTiles: Set<number>;
  exit: Vec2;
  aiStepMs: number;
  baseContactDamage: number;
  invulnerabilityMs: number;
  critChance: number;
  maxActiveEnemies: number;
  respawnDelayMs: number;
  maxPlayerDeaths: number;
  surviveTargetMs: number;
  rngState: number;
  questState: RpgRuntimeQuestState;
};

export function asRpgPackage(pkg: GamePackage): RpgTopdownPackage {
  return pkg as unknown as RpgTopdownPackage;
}

export function asRpgRuntimeState(value: unknown): RpgRuntimeState {
  return value as RpgRuntimeState;
}

export function asEnemyStateById(enemies: EnemyState[]): Record<string, EnemyState> {
  const byId: Record<string, EnemyState> = {};
  for (const enemy of enemies) {
    byId[enemy.instanceId] = enemy;
  }
  return byId;
}
