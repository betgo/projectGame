import type { Dispatch } from "react";

import type { GameProject } from "@runtime/core/types";

import type { EditorOperation } from "../operations";

type Props = {
  project: GameProject;
  dispatch: Dispatch<EditorOperation>;
};

function classNameForCell(value: number): string {
  if (value === 1) {
    return "cell path";
  }
  if (value === 2) {
    return "cell tower";
  }
  return "cell";
}

export function MapCanvas({ project, dispatch }: Props) {
  const { map } = project;

  return (
    <div className="panel">
      <h3>Map Editor</h3>
      <div className="small">Tool: {project.editorState.selectedTool}</div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${map.width}, 24px)` }}>
        {map.cells.map((row, y) =>
          row.map((value, x) => (
            <button
              key={`${x}-${y}`}
              className={classNameForCell(value)}
              onClick={() => dispatch({ type: "paint-cell", x, y })}
              title={`(${x}, ${y})`}
            />
          ))
        )}
      </div>
    </div>
  );
}
