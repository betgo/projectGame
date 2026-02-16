export type TemplateId = "tower-defense" | (string & {});

export type GridCell = 0 | 1 | 2;

export type Vec2 = {
  x: number;
  y: number;
};

export type GameMap = {
  width: number;
  height: number;
  cells: GridCell[][];
};

export type TowerDefinition = {
  id: string;
  x: number;
  y: number;
  range: number;
  damage: number;
  cooldownMs: number;
  cost: number;
};

export type EnemyDefinition = {
  id: string;
  hp: number;
  speed: number;
  reward: number;
};

export type WaveDefinition = {
  id: string;
  enemyId: string;
  count: number;
  intervalMs: number;
  startAtMs: number;
};

export type TowerDefensePayload = {
  path: Vec2[];
  waves: WaveDefinition[];
  towers: TowerDefinition[];
  economy: {
    startingGold: number;
    rewardPerKill: number;
  };
  spawnRules: {
    tickMs: number;
    baseEnemyHp: number;
    baseEnemySpeed: number;
    baseEnemyReward: number;
  };
};

export type GameProject = {
  meta: {
    name: string;
    version: string;
  };
  templateId: TemplateId;
  map: GameMap;
  templatePayload: TowerDefensePayload;
  editorState: {
    selectedTool: "empty" | "path" | "tower";
    speed: number;
  };
};

export type GamePackage = {
  version: string;
  templateId: TemplateId;
  map: GameMap;
  entities: {
    towers: TowerDefinition[];
    enemies: EnemyDefinition[];
  };
  rules: {
    payload: TowerDefensePayload;
  };
  winCondition: {
    maxLeaks: number;
  };
};

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationReport = {
  valid: boolean;
  issues: ValidationIssue[];
};

export type EnemyState = {
  instanceId: string;
  typeId: string;
  hp: number;
  progress: number;
  x: number;
  y: number;
};

export type TowerState = TowerDefinition & {
  cooldownLeftMs: number;
};

export type RuntimeMetrics = {
  kills: number;
  leaks: number;
  damageDealt: number;
  shotsFired: number;
  goldEarned: number;
};

export type RuntimeStatus = "running" | "won" | "lost";

export type RuntimeWorld = {
  templateId: TemplateId;
  tick: number;
  elapsedMs: number;
  seed: number;
  status: RuntimeStatus;
  lives: number;
  towers: TowerState[];
  enemies: EnemyState[];
  path: Vec2[];
  map: GameMap;
  pkg: GamePackage;
  metrics: RuntimeMetrics;
  internal: {
    spawnQueue: SpawnEvent[];
    nextEnemyInstanceId: number;
  };
};

export type SpawnEvent = {
  atMs: number;
  enemyId: string;
};

export type TickResult = {
  status: RuntimeStatus;
  tick: number;
  elapsedMs: number;
  metrics: RuntimeMetrics;
};

export type MatchResult = {
  winner: "defender" | "enemy";
  durationTicks: number;
  durationMs: number;
  seed: number;
  metrics: RuntimeMetrics;
};

export type BatchRunInput = {
  seeds: number[];
};

export type BatchMetrics = {
  sampleSize: number;
  winRate: number;
  avgDuration: number;
  leakRate: number;
  imbalanceIndex: number;
};

export type BatchResult = BatchMetrics & {
  seeds: number[];
  errors: string[];
};

export type RuntimeTemplate = {
  id: TemplateId;
  createWorld: (pkg: GamePackage, seed: number) => RuntimeWorld;
  step: (world: RuntimeWorld, deltaMs: number) => TickResult;
  validate: (pkg: GamePackage) => ValidationReport;
};

export type RenderEnemy = {
  id: string;
  x: number;
  y: number;
  hp: number;
};

export type RenderTower = {
  id: string;
  x: number;
  y: number;
  cooldown: number;
};

export type RenderSnapshot = {
  tick: number;
  elapsedMs: number;
  status: RuntimeStatus;
  map: GameMap;
  path: Vec2[];
  enemies: RenderEnemy[];
  towers: RenderTower[];
  metrics: RuntimeMetrics;
};

export type BalanceTarget = {
  targetWinRate: number;
  maxLeakRate: number;
};
