import type { GameProject, GridCell } from "@runtime/core/types";

import { sanitizeMapSize, sanitizeSpeed } from "./inspector-form";

export type EditorOperation =
  | { type: "set-tool"; tool: GameProject["editorState"]["selectedTool"] }
  | { type: "paint-cell"; x: number; y: number; tool?: GameProject["editorState"]["selectedTool"] }
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

  next.templatePayload.path = path;
  next.templatePayload.towers = towers;
}

function toToolCell(tool: GameProject["editorState"]["selectedTool"]): GridCell {
  if (tool === "path") {
    return 1;
  }
  if (tool === "tower") {
    return 2;
  }
  return 0;
}

function isCellInMap(project: GameProject, x: number, y: number): boolean {
  return Boolean(project.map.cells[y]) && typeof project.map.cells[y][x] !== "undefined";
}

export function applyOperation(project: GameProject, op: EditorOperation): OpResult {
  switch (op.type) {
    case "set-tool": {
      if (project.editorState.selectedTool === op.tool) {
        return { ok: true, project };
      }
      const next: GameProject = structuredClone(project);
      next.editorState.selectedTool = op.tool;
      return { ok: true, project: next };
    }
    case "paint-cell": {
      if (!isCellInMap(project, op.x, op.y)) {
        return { ok: false, project, message: "cell out of range" };
      }
      const tool = op.tool ?? project.editorState.selectedTool;
      const value = toToolCell(tool);
      if (project.map.cells[op.y][op.x] === value) {
        return { ok: true, project };
      }
      const next: GameProject = structuredClone(project);
      next.map.cells[op.y][op.x] = value;
      syncPayloadFromCells(next);
      return { ok: true, project: next };
    }
    case "set-speed": {
      const speed = sanitizeSpeed(op.speed, project.editorState.speed);
      if (speed === project.editorState.speed) {
        return { ok: true, project };
      }
      const next: GameProject = structuredClone(project);
      next.editorState.speed = speed;
      return { ok: true, project: next };
    }
    case "set-map-size": {
      const width = sanitizeMapSize(op.width, project.map.width);
      const height = sanitizeMapSize(op.height, project.map.height);
      if (width === project.map.width && height === project.map.height) {
        return { ok: true, project };
      }
      const next: GameProject = structuredClone(project);
      next.map.width = width;
      next.map.height = height;
      next.map.cells = resizeCells(project, width, height);
      syncPayloadFromCells(next);
      return { ok: true, project: next };
    }
    default:
      return { ok: false, project, message: "unknown operation" };
  }
}
