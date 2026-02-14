import type { GameProject } from "@runtime/core/types";

type Props = {
  project: GameProject;
};

export function WavePanel({ project }: Props) {
  return (
    <div className="panel">
      <h3>Wave Panel</h3>
      {project.templatePayload.waves.map((wave) => (
        <div key={wave.id} className="small">
          {wave.id}: {wave.count} x {wave.enemyId}, every {wave.intervalMs}ms
        </div>
      ))}
    </div>
  );
}
