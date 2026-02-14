import type { Dispatch } from "react";

import type { GameProject } from "@runtime/core/types";

import type { EditorOperation } from "../operations";

type Props = {
  project: GameProject;
  dispatch: Dispatch<EditorOperation>;
};

export function Inspector({ project, dispatch }: Props) {
  return (
    <div className="panel">
      <h3>Inspector</h3>
      <div className="row">
        <button className="secondary" onClick={() => dispatch({ type: "set-tool", tool: "empty" })}>
          Empty
        </button>
        <button className="secondary" onClick={() => dispatch({ type: "set-tool", tool: "path" })}>
          Path
        </button>
        <button className="secondary" onClick={() => dispatch({ type: "set-tool", tool: "tower" })}>
          Tower
        </button>
      </div>
      <div className="row">
        <label htmlFor="speed">Preview Speed</label>
        <input
          id="speed"
          type="number"
          min={0.5}
          max={8}
          step={0.5}
          value={project.editorState.speed}
          onChange={(event) => dispatch({ type: "set-speed", speed: Number(event.target.value) })}
        />
      </div>
      <div className="small">Map: {project.map.width} x {project.map.height}</div>
      <div className="small">Path Nodes: {project.templatePayload.path.length}</div>
      <div className="small">Tower Count: {project.templatePayload.towers.length}</div>
    </div>
  );
}
