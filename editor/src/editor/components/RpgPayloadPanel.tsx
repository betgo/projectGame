import type { GameProject } from "@runtime/core/types";

import { getRpgPayload } from "../template-switch";

type Props = {
  project: GameProject;
};

export function RpgPayloadPanel({ project }: Props) {
  const payload = getRpgPayload(project);

  return (
    <div className="panel">
      <h3>RPG Payload</h3>
      <div className="small">
        Exit: ({payload.map.exit.x}, {payload.map.exit.y})
      </div>
      <div className="small">Walkable tiles: {payload.map.walkableTiles.join(", ")}</div>
      <div className="small">Spawn zones: {payload.map.spawnZones.length}</div>
      <div className="small">Enemy profiles: {payload.entities.enemies.length}</div>
      <div className="small">Tick: {payload.rules.tick.tickMs}ms</div>
    </div>
  );
}
