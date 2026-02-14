import type { GameProject, GridCell } from "@runtime/core/types";

export type EditorOperation =
  | { type: "set-tool"; tool: GameProject["editorState"]["selectedTool"] }
  | { type: "paint-cell"; x: number; y: number }
  | { type: "set-speed"; speed: number }
  | { type: "set-map-size"; width: number; height: number };

export type OpResult = {
  ok: boolean;
  project: GameProject;
  message?: string;
};

function resizeCells(project: GameProject, width: number, height: number): GridCell[][] {
  const rows: GridCell[][] = [];
  for (let y = 0; y < height; y += 1) {
    const row: GridCell[] = [];
    for (let x = 0; x < width; x += 1) {
      row.push(project.map.cells[y]?.[x] ?? 0);
    }
    rows.push(row);
  }
  return rows;
}

function syncPayloadFromCells(next: GameProject): void {
  const path: GameProject["templatePayload"]["path"] = [];
  const towers: GameProject["templatePayload"]["towers"] = [];

  for (let y = 0; y < next.map.height; y += 1) {
    for (let x = 0; x < next.map.width; x += 1) {
      const value = next.map.cells[y]?.[x] ?? 0;
      if (value === 1) {
        path.push({ x, y });
      } else if (value === 2) {
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
  }

  if (path.length >= 2) {
    next.templatePayload.path = path;
  }
  next.templatePayload.towers = towers;
}

export function applyOperation(project: GameProject, op: EditorOperation): OpResult {
  const next: GameProject = structuredClone(project);

  switch (op.type) {
    case "set-tool":
      next.editorState.selectedTool = op.tool;
      return { ok: true, project: next };
    case "paint-cell": {
      const tool = next.editorState.selectedTool;
      const value: GridCell = tool === "path" ? 1 : tool === "tower" ? 2 : 0;
      if (!next.map.cells[op.y] || typeof next.map.cells[op.y][op.x] === "undefined") {
        return { ok: false, project, message: "cell out of range" };
      }
      next.map.cells[op.y][op.x] = value;
      syncPayloadFromCells(next);
      return { ok: true, project: next };
    }
    case "set-speed":
      next.editorState.speed = op.speed;
      return { ok: true, project: next };
    case "set-map-size":
      next.map.width = op.width;
      next.map.height = op.height;
      next.map.cells = resizeCells(next, op.width, op.height);
      syncPayloadFromCells(next);
      return { ok: true, project: next };
    default:
      return { ok: false, project, message: "unknown operation" };
  }
}
