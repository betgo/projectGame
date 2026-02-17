import { CURRENT_SCHEMA_VERSION } from "@game/schemas/index";
import type { GameProject, GridCell } from "@runtime/core/types";

export type SupportedTemplateId = "tower-defense" | "rpg-topdown";
export type EditorTool = "empty" | "path" | "tower" | "terrain" | "spawn" | "entity";
export type TemplateSwitchWarningCode =
  | "switch.compatibility.payload-reset"
  | "switch.compatibility.cell-remap";

export type TemplateSwitchWarning = {
  code: TemplateSwitchWarningCode;
  path: string;
  message: string;
  hint: string;
};

export type TemplateSwitchPreview = {
  fromTemplateId: SupportedTemplateId;
  toTemplateId: SupportedTemplateId;
  candidate: GameProject;
  warnings: TemplateSwitchWarning[];
  requiresConfirmation: boolean;
};

export type TemplateSwitchResolution = TemplateSwitchPreview & {
  applied: boolean;
  project: GameProject;
  message?: string;
};

export type TemplateToolOption = {
  tool: EditorTool;
  label: string;
};

type TdPayload = GameProject["templatePayload"];

export type RpgTopdownPayload = {
  map: {
    walkableTiles: number[];
    spawnZones: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      enemyTypeId: string;
    }>;
    exit: {
      x: number;
      y: number;
    };
  };
  entities: {
    player: {
      maxHp: number;
      attack: number;
      defense: number;
      moveSpeed: number;
    };
    enemies: Array<{
      id: string;
      maxHp: number;
      attack: number;
      defense: number;
      moveSpeed: number;
      aggroRange: number;
      xpReward: number;
    }>;
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

type RpgTopdownProject = Omit<GameProject, "templateId" | "templatePayload" | "editorState"> & {
  templateId: "rpg-topdown";
  templatePayload: RpgTopdownPayload;
  editorState: {
    selectedTool: "terrain" | "spawn" | "entity";
    speed: number;
  };
};

const DEFAULT_SPEED = 1;
const TEMPLATE_IDS: SupportedTemplateId[] = ["tower-defense", "rpg-topdown"];

export const TEMPLATE_LABELS: Record<SupportedTemplateId, string> = {
  "tower-defense": "Tower Defense",
  "rpg-topdown": "RPG Topdown"
};

export const TEMPLATE_TOOL_OPTIONS: Record<SupportedTemplateId, TemplateToolOption[]> = {
  "tower-defense": [
    { tool: "empty", label: "Empty" },
    { tool: "path", label: "Path" },
    { tool: "tower", label: "Tower" }
  ],
  "rpg-topdown": [
    { tool: "terrain", label: "Terrain" },
    { tool: "spawn", label: "Spawn" },
    { tool: "entity", label: "Entity" }
  ]
};

function createDefaultCells(width: number, height: number): GridCell[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => 0 as GridCell));
}

function seedCells(
  width: number,
  height: number,
  path: Array<{ x: number; y: number }>,
  towers: Array<{ x: number; y: number }>
): GridCell[][] {
  const cells = createDefaultCells(width, height);
  for (const point of path) {
    if (cells[point.y]?.[point.x] !== undefined) {
      cells[point.y][point.x] = 1;
    }
  }
  for (const tower of towers) {
    if (cells[tower.y]?.[tower.x] !== undefined) {
      cells[tower.y][tower.x] = 2;
    }
  }
  return cells;
}

function createDefaultTdPayload(): TdPayload {
  const path = [
    { x: 0, y: 5 },
    { x: 3, y: 5 },
    { x: 6, y: 4 },
    { x: 11, y: 4 }
  ];
  const towers = [{ id: "t1", x: 4, y: 4, range: 2.5, damage: 8, cooldownMs: 600, cost: 50 }];

  return {
    path,
    waves: [{ id: "w1", enemyId: "grunt", count: 10, intervalMs: 1000, startAtMs: 0 }],
    towers,
    economy: {
      startingGold: 100,
      rewardPerKill: 5
    },
    spawnRules: {
      tickMs: 100,
      baseEnemyHp: 40,
      baseEnemySpeed: 1,
      baseEnemyReward: 5
    }
  };
}

function createDefaultRpgPayload(): RpgTopdownPayload {
  return {
    map: {
      walkableTiles: [0, 1],
      spawnZones: [
        {
          id: "north-cave",
          x: 6,
          y: 1,
          width: 2,
          height: 2,
          enemyTypeId: "slime"
        }
      ],
      exit: {
        x: 9,
        y: 7
      }
    },
    entities: {
      player: {
        maxHp: 120,
        attack: 16,
        defense: 8,
        moveSpeed: 3.5
      },
      enemies: [
        {
          id: "slime",
          maxHp: 40,
          attack: 10,
          defense: 2,
          moveSpeed: 2.2,
          aggroRange: 4,
          xpReward: 6
        }
      ]
    },
    rules: {
      tick: {
        tickMs: 50,
        aiStepMs: 100
      },
      combat: {
        baseContactDamage: 8,
        invulnerabilityMs: 300,
        critChance: 0.1
      },
      spawn: {
        maxActiveEnemies: 4,
        respawnDelayMs: 1200
      }
    }
  };
}

export function createDefaultTowerDefenseProject(): GameProject {
  const payload = createDefaultTdPayload();
  return {
    meta: {
      name: "td-v1",
      version: CURRENT_SCHEMA_VERSION
    },
    templateId: "tower-defense",
    map: {
      width: 12,
      height: 12,
      cells: seedCells(
        12,
        12,
        payload.path,
        payload.towers.map((tower) => ({ x: tower.x, y: tower.y }))
      )
    },
    templatePayload: payload,
    editorState: {
      selectedTool: "path",
      speed: DEFAULT_SPEED
    }
  };
}

export function createDefaultRpgTopdownProject(): GameProject {
  const payload = createDefaultRpgPayload();
  const cells: GridCell[][] = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
    [0, 1, 2, 1, 0, 0, 1, 2, 1, 0],
    [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0, 1, 0],
    [0, 1, 2, 2, 2, 2, 1, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0]
  ];

  const project: RpgTopdownProject = {
    meta: {
      name: "rpg-topdown-mvp",
      version: CURRENT_SCHEMA_VERSION
    },
    templateId: "rpg-topdown",
    map: {
      width: 10,
      height: 8,
      cells
    },
    templatePayload: payload,
    editorState: {
      selectedTool: "terrain",
      speed: DEFAULT_SPEED
    }
  };

  return project as unknown as GameProject;
}

export function createProjectByTemplate(templateId: SupportedTemplateId): GameProject {
  if (templateId === "tower-defense") {
    return createDefaultTowerDefenseProject();
  }
  return createDefaultRpgTopdownProject();
}

export function resolveSupportedTemplateId(value: string): SupportedTemplateId | null {
  if (TEMPLATE_IDS.includes(value as SupportedTemplateId)) {
    return value as SupportedTemplateId;
  }
  return null;
}

export function getProjectTemplateId(project: GameProject): SupportedTemplateId {
  return resolveSupportedTemplateId(project.templateId) ?? "tower-defense";
}

export function getTemplateToolOptions(templateId: SupportedTemplateId): TemplateToolOption[] {
  return TEMPLATE_TOOL_OPTIONS[templateId];
}

export function isTemplateTool(templateId: SupportedTemplateId, tool: EditorTool): boolean {
  return TEMPLATE_TOOL_OPTIONS[templateId].some((option) => option.tool === tool);
}

export function normalizeTemplateTool(templateId: SupportedTemplateId, tool: EditorTool): EditorTool {
  if (isTemplateTool(templateId, tool)) {
    return tool;
  }
  return TEMPLATE_TOOL_OPTIONS[templateId][0].tool;
}

export function getCurrentEditorTool(project: GameProject): EditorTool {
  const templateId = getProjectTemplateId(project);
  return normalizeTemplateTool(templateId, project.editorState.selectedTool as EditorTool);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.floor(value);
}

function normalizeSpeed(value: number, fallback: number): number {
  const source = Number.isFinite(value) ? value : fallback;
  const clamped = clampNumber(source, 0.5, 8);
  return Math.round(clamped * 2) / 2;
}

function normalizeCellForTemplate(value: number, templateId: SupportedTemplateId): GridCell {
  const numeric = toInteger(value, 0);
  if (templateId === "tower-defense") {
    if (numeric >= 2) {
      return 2;
    }
    if (numeric === 1) {
      return 1;
    }
    return 0;
  }

  if (numeric >= 3) {
    return 3;
  }
  if (numeric === 2) {
    return 2;
  }
  if (numeric === 1) {
    return 1;
  }
  return 0;
}

function normalizeMapForTemplate(
  map: GameProject["map"],
  templateId: SupportedTemplateId
): GameProject["map"] {
  const width = Math.max(4, toInteger(map.width, 12));
  const height = Math.max(4, toInteger(map.height, 12));
  const cells: GridCell[][] = [];
  for (let y = 0; y < height; y += 1) {
    const row: GridCell[] = [];
    for (let x = 0; x < width; x += 1) {
      row.push(normalizeCellForTemplate(map.cells[y]?.[x] ?? 0, templateId));
    }
    cells.push(row);
  }
  return {
    width,
    height,
    cells
  };
}

function buildFallbackPath(width: number, height: number): TdPayload["path"] {
  const y = Math.max(0, Math.floor(height / 2));
  return [
    { x: 0, y },
    { x: Math.max(1, width - 1), y }
  ];
}

function extractTdPath(cells: GridCell[][], width: number, height: number): TdPayload["path"] {
  const path: TdPayload["path"] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((cells[y]?.[x] ?? 0) === 1) {
        path.push({ x, y });
      }
    }
  }
  return path.length >= 2 ? path : buildFallbackPath(width, height);
}

function extractTdTowers(cells: GridCell[][], width: number, height: number): TdPayload["towers"] {
  const towers: TdPayload["towers"] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((cells[y]?.[x] ?? 0) !== 2) {
        continue;
      }
      towers.push({
        id: `tower-${x}-${y}`,
        x,
        y,
        range: 2.5,
        damage: 8,
        cooldownMs: 600,
        cost: 50
      });
    }
  }
  return towers;
}

function toRpgProject(project: GameProject): RpgTopdownProject {
  return project as unknown as RpgTopdownProject;
}

export function getRpgPayload(project: GameProject): RpgTopdownPayload {
  return toRpgProject(project).templatePayload;
}

function findFirstWalkableCell(map: GameProject["map"], walkableTiles: Set<number>): { x: number; y: number } {
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      if (walkableTiles.has(map.cells[y]?.[x] ?? -1)) {
        return { x, y };
      }
    }
  }
  return { x: 0, y: 0 };
}

function hasWalkableCell(map: GameProject["map"], walkableTiles: Set<number>): boolean {
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      if (walkableTiles.has(map.cells[y]?.[x] ?? -1)) {
        return true;
      }
    }
  }
  return false;
}

function resolveFallbackWalkableTile(map: GameProject["map"]): number {
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      return normalizeCellForTemplate(map.cells[y]?.[x] ?? 0, "rpg-topdown");
    }
  }
  return 0;
}

function isWalkableCell(
  map: GameProject["map"],
  walkableTiles: Set<number>,
  x: number,
  y: number
): boolean {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
    return false;
  }
  return walkableTiles.has(map.cells[y]?.[x] ?? -1);
}

function zoneContainsWalkableCell(
  map: GameProject["map"],
  walkableTiles: Set<number>,
  zone: { x: number; y: number; width: number; height: number }
): boolean {
  for (let y = zone.y; y < zone.y + zone.height; y += 1) {
    for (let x = zone.x; x < zone.x + zone.width; x += 1) {
      if (isWalkableCell(map, walkableTiles, x, y)) {
        return true;
      }
    }
  }
  return false;
}

function hasWalkablePath(
  map: GameProject["map"],
  walkableTiles: Set<number>,
  start: { x: number; y: number },
  target: { x: number; y: number }
): boolean {
  if (start.x === target.x && start.y === target.y) {
    return true;
  }

  const queue: Array<{ x: number; y: number }> = [{ x: start.x, y: start.y }];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  const neighbors = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
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
      if (visited.has(key) || !isWalkableCell(map, walkableTiles, next.x, next.y)) {
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

function normalizeRpgPayloadMap(project: RpgTopdownProject): void {
  const width = project.map.width;
  const height = project.map.height;
  const payload = project.templatePayload;
  const walkableTiles = new Set(payload.map.walkableTiles.filter((tile) => tile >= 0 && tile <= 3));
  if (walkableTiles.size === 0) {
    walkableTiles.add(0);
    walkableTiles.add(1);
  }
  if (!hasWalkableCell(project.map, walkableTiles)) {
    walkableTiles.add(resolveFallbackWalkableTile(project.map));
  }
  payload.map.walkableTiles = [...walkableTiles];

  const firstWalkable = findFirstWalkableCell(project.map, walkableTiles);
  const enemyTypeId = payload.entities.enemies[0]?.id ?? "slime";
  if (payload.entities.enemies.length === 0) {
    payload.entities.enemies = [
      {
        id: enemyTypeId,
        maxHp: 40,
        attack: 10,
        defense: 2,
        moveSpeed: 2.2,
        aggroRange: 4,
        xpReward: 6
      }
    ];
  }

  const zones = payload.map.spawnZones
    .map((zone, index) => {
      const x = clampNumber(toInteger(zone.x, firstWalkable.x), 0, width - 1);
      const y = clampNumber(toInteger(zone.y, firstWalkable.y), 0, height - 1);
      const zoneWidth = clampNumber(toInteger(zone.width, 1), 1, width - x);
      const zoneHeight = clampNumber(toInteger(zone.height, 1), 1, height - y);

      return {
        id: zone.id || `zone-${index + 1}`,
        x,
        y,
        width: zoneWidth,
        height: zoneHeight,
        enemyTypeId: zone.enemyTypeId || enemyTypeId
      };
    })
    .map((zone) => {
      if (zoneContainsWalkableCell(project.map, walkableTiles, zone)) {
        return zone;
      }
      return {
        ...zone,
        x: firstWalkable.x,
        y: firstWalkable.y,
        width: 1,
        height: 1
      };
    })
    .filter((zone) => zone.width > 0 && zone.height > 0);

  if (zones.length === 0) {
    zones.push({
      id: "zone-1",
      x: firstWalkable.x,
      y: firstWalkable.y,
      width: 1,
      height: 1,
      enemyTypeId
    });
  }
  payload.map.spawnZones = zones;

  const normalizedExit = {
    x: clampNumber(toInteger(payload.map.exit.x, firstWalkable.x), 0, width - 1),
    y: clampNumber(toInteger(payload.map.exit.y, firstWalkable.y), 0, height - 1)
  };
  payload.map.exit = isWalkableCell(project.map, walkableTiles, normalizedExit.x, normalizedExit.y)
    ? normalizedExit
    : { x: firstWalkable.x, y: firstWalkable.y };
  if (!hasWalkablePath(project.map, walkableTiles, firstWalkable, payload.map.exit)) {
    payload.map.exit = { x: firstWalkable.x, y: firstWalkable.y };
  }
}

export function normalizeRpgProjectPayload(project: GameProject): void {
  if (getProjectTemplateId(project) !== "rpg-topdown") {
    return;
  }
  normalizeRpgPayloadMap(toRpgProject(project));
}

function countCellsOutsideTowerDefenseRange(map: GameProject["map"]): number {
  let count = 0;
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      if ((map.cells[y]?.[x] ?? 0) > 2) {
        count += 1;
      }
    }
  }
  return count;
}

function buildWarnings(
  fromTemplateId: SupportedTemplateId,
  toTemplateId: SupportedTemplateId,
  project: GameProject
): TemplateSwitchWarning[] {
  if (fromTemplateId === toTemplateId) {
    return [];
  }

  const warnings: TemplateSwitchWarning[] = [
    {
      code: "switch.compatibility.payload-reset",
      path: "/templatePayload",
      message: `Switching from ${fromTemplateId} to ${toTemplateId} replaces templatePayload with ${toTemplateId} defaults.`,
      hint: "Review payload-specific sections before saving or exporting."
    }
  ];

  if (toTemplateId === "tower-defense") {
    const remappedCells = countCellsOutsideTowerDefenseRange(project.map);
    if (remappedCells > 0) {
      warnings.push({
        code: "switch.compatibility.cell-remap",
        path: "/map/cells",
        message: `${remappedCells} map cell(s) exceed tower-defense cell range and will be remapped to tower cells.`,
        hint: "Inspect the map after switching and repaint cells if needed."
      });
    }
  }

  return warnings;
}

function buildSwitchCandidate(project: GameProject, toTemplateId: SupportedTemplateId): GameProject {
  const fromTemplateId = getProjectTemplateId(project);
  if (fromTemplateId === toTemplateId) {
    return project;
  }

  const baseline = createProjectByTemplate(toTemplateId);
  const next: GameProject = structuredClone(baseline);
  next.meta.name = project.meta.name;
  next.meta.version = CURRENT_SCHEMA_VERSION;
  next.editorState.speed = normalizeSpeed(project.editorState.speed, baseline.editorState.speed);
  next.map = normalizeMapForTemplate(project.map, toTemplateId);

  if (toTemplateId === "tower-defense") {
    const tdPayload = createDefaultTdPayload();
    tdPayload.path = extractTdPath(next.map.cells, next.map.width, next.map.height);
    tdPayload.towers = extractTdTowers(next.map.cells, next.map.width, next.map.height);
    next.templatePayload = tdPayload;
    next.editorState.selectedTool = normalizeTemplateTool(
      toTemplateId,
      project.editorState.selectedTool as EditorTool
    ) as GameProject["editorState"]["selectedTool"];
    return next;
  }

  const rpg = toRpgProject(next);
  normalizeRpgPayloadMap(rpg);
  rpg.editorState.selectedTool = normalizeTemplateTool(
    "rpg-topdown",
    project.editorState.selectedTool as EditorTool
  ) as RpgTopdownProject["editorState"]["selectedTool"];
  return rpg as unknown as GameProject;
}

export function previewTemplateSwitch(
  project: GameProject,
  toTemplateId: SupportedTemplateId
): TemplateSwitchPreview {
  const fromTemplateId = getProjectTemplateId(project);
  const candidate = buildSwitchCandidate(project, toTemplateId);
  const warnings = buildWarnings(fromTemplateId, toTemplateId, project);

  return {
    fromTemplateId,
    toTemplateId,
    candidate,
    warnings,
    requiresConfirmation: warnings.length > 0
  };
}

export function applyTemplateSwitch(
  project: GameProject,
  toTemplateId: SupportedTemplateId,
  force: boolean
): TemplateSwitchResolution {
  const preview = previewTemplateSwitch(project, toTemplateId);
  if (preview.requiresConfirmation && !force) {
    return {
      ...preview,
      applied: false,
      project,
      message: "template switch requires confirmation"
    };
  }

  return {
    ...preview,
    applied: true,
    project: preview.candidate
  };
}
