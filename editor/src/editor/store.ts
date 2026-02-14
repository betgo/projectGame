import { useMemo, useReducer } from "react";

import type { GameProject, GridCell } from "@runtime/core/types";

import { applyOperation, type EditorOperation } from "./operations";

function createDefaultCells(width: number, height: number) {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 0 as GridCell)
  );
}

function seedCells(
  width: number,
  height: number,
  path: Array<{ x: number; y: number }>,
  towers: Array<{ x: number; y: number }>
) {
  const cells: GridCell[][] = createDefaultCells(width, height);
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

export function createDefaultProject(): GameProject {
  const path = [
    { x: 0, y: 5 },
    { x: 3, y: 5 },
    { x: 6, y: 4 },
    { x: 11, y: 4 }
  ];
  const towers = [{ id: "t1", x: 4, y: 4, range: 2.5, damage: 8, cooldownMs: 600, cost: 50 }];

  return {
    meta: {
      name: "td-v1",
      version: "0.1.0"
    },
    templateId: "tower-defense",
    map: {
      width: 12,
      height: 12,
      cells: seedCells(12, 12, path, towers)
    },
    templatePayload: {
      path,
      waves: [
        { id: "w1", enemyId: "grunt", count: 10, intervalMs: 1000, startAtMs: 0 }
      ],
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
    },
    editorState: {
      selectedTool: "path",
      speed: 1
    }
  };
}

function reducer(state: GameProject, op: EditorOperation): GameProject {
  const result = applyOperation(state, op);
  return result.ok ? result.project : state;
}

export function useEditorStore(initial?: GameProject) {
  const [project, dispatch] = useReducer(reducer, initial ?? createDefaultProject());
  return useMemo(
    () => ({
      project,
      dispatch
    }),
    [project]
  );
}
