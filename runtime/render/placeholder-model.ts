import type { GridCell, RenderSnapshot } from "../core/types";

export type MapPlaceholder = {
  kind: "empty" | "path" | "tower";
  x: number;
  y: number;
};

export type PathPlaceholder = {
  x: number;
  y: number;
  order: number;
};

export type TowerPlaceholder = {
  id: string;
  x: number;
  y: number;
  cooldown: number;
};

export type EnemyPlaceholder = {
  id: string;
  x: number;
  y: number;
  hp: number;
};

export type PlaceholderFrame = {
  width: number;
  height: number;
  map: MapPlaceholder[];
  path: PathPlaceholder[];
  towers: TowerPlaceholder[];
  enemies: EnemyPlaceholder[];
};

function toMapKind(cell: GridCell): MapPlaceholder["kind"] {
  if (cell === 1) {
    return "path";
  }
  if (cell === 2) {
    return "tower";
  }
  return "empty";
}

export function buildPlaceholderFrame(snapshot: RenderSnapshot): PlaceholderFrame {
  const map: MapPlaceholder[] = [];

  for (let y = 0; y < snapshot.map.height; y += 1) {
    for (let x = 0; x < snapshot.map.width; x += 1) {
      const cell = snapshot.map.cells[y]?.[x] ?? 0;
      map.push({
        kind: toMapKind(cell),
        x,
        y
      });
    }
  }

  return {
    width: snapshot.map.width,
    height: snapshot.map.height,
    map,
    path: snapshot.path.map((node, order) => ({
      x: node.x,
      y: node.y,
      order
    })),
    towers: snapshot.towers.map((tower) => ({
      id: tower.id,
      x: tower.x,
      y: tower.y,
      cooldown: tower.cooldown
    })),
    enemies: snapshot.enemies.map((enemy) => ({
      id: enemy.id,
      x: enemy.x,
      y: enemy.y,
      hp: enemy.hp
    }))
  };
}
