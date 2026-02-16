import { describe, expect, it } from "vitest";

import { createProject, startPreview } from "@editor/editor/api";
import type { RenderSnapshot } from "@runtime/core/types";
import { buildPlaceholderFrame } from "@runtime/render/placeholder-model";
import { getWorldSnapshot } from "@runtime/render/snapshot";

describe("three render snapshot contract", () => {
  it("captures map/path/tower/enemy data without mutating runtime world", () => {
    const project = createProject("tower-defense");
    const session = startPreview(project, 5);

    session.playStep();

    const worldBefore = structuredClone(session.world);
    const snapshot = getWorldSnapshot(session.world);

    expect(snapshot.map.width).toBe(worldBefore.map.width);
    expect(snapshot.map.height).toBe(worldBefore.map.height);
    expect(snapshot.map.cells).toEqual(worldBefore.map.cells);
    expect(snapshot.path).toEqual(worldBefore.path);
    expect(snapshot.towers).toHaveLength(worldBefore.towers.length);
    expect(snapshot.enemies.length).toBeGreaterThan(0);

    snapshot.map.cells[0][0] = 2;
    snapshot.path[0].x = 99;
    snapshot.towers[0].x = 88;
    snapshot.enemies[0].x = 77;
    snapshot.metrics.kills = 999;

    expect(session.world).toEqual(worldBefore);
  });

  it("builds deterministic placeholder frame from RenderSnapshot", () => {
    const snapshot: RenderSnapshot = {
      tick: 12,
      elapsedMs: 1200,
      status: "running",
      map: {
        width: 3,
        height: 2,
        cells: [
          [0, 1, 2],
          [2, 0, 1]
        ]
      },
      path: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 1 }
      ],
      towers: [{ id: "tower-1", x: 2, y: 0, cooldown: 300 }],
      enemies: [{ id: "enemy-1", x: 0.5, y: 1.2, hp: 25 }],
      metrics: {
        kills: 1,
        leaks: 0,
        damageDealt: 10,
        shotsFired: 2,
        goldEarned: 5
      }
    };

    const frame = buildPlaceholderFrame(snapshot);

    expect(frame.width).toBe(3);
    expect(frame.height).toBe(2);
    expect(frame.map).toEqual([
      { kind: "empty", x: 0, y: 0 },
      { kind: "path", x: 1, y: 0 },
      { kind: "tower", x: 2, y: 0 },
      { kind: "tower", x: 0, y: 1 },
      { kind: "empty", x: 1, y: 1 },
      { kind: "path", x: 2, y: 1 }
    ]);
    expect(frame.path).toEqual([
      { x: 0, y: 0, order: 0 },
      { x: 1, y: 0, order: 1 },
      { x: 2, y: 1, order: 2 }
    ]);
    expect(frame.towers).toEqual([{ id: "tower-1", x: 2, y: 0, cooldown: 300 }]);
    expect(frame.enemies).toEqual([{ id: "enemy-1", x: 0.5, y: 1.2, hp: 25 }]);

    frame.path[0].x = 999;
    frame.map[2].kind = "empty";
    frame.towers[0].x = 123;
    frame.enemies[0].hp = 0;

    expect(snapshot.path[0].x).toBe(0);
    expect(snapshot.map.cells[0][2]).toBe(2);
    expect(snapshot.towers[0].x).toBe(2);
    expect(snapshot.enemies[0].hp).toBe(25);
  });
});
