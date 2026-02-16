import type { Dispatch, FormEvent } from "react";
import { useEffect, useState } from "react";

import type { GameProject } from "@runtime/core/types";

import {
  commitMapSizeDraft,
  commitSpeedDraft,
  formatInspectorNumber,
  getMapSizeDraftHint,
  getSpeedDraftHint,
  INSPECTOR_MAP_SIZE_MAX,
  INSPECTOR_MAP_SIZE_MIN,
  INSPECTOR_SPEED_MAX,
  INSPECTOR_SPEED_MIN,
  INSPECTOR_SPEED_STEP,
  type MapAxis
} from "../inspector-form";
import type { EditorOperation } from "../operations";

type Props = {
  project: GameProject;
  dispatch: Dispatch<EditorOperation>;
};

const toolOptions: Array<{ tool: GameProject["editorState"]["selectedTool"]; label: string }> = [
  { tool: "empty", label: "Empty" },
  { tool: "path", label: "Path" },
  { tool: "tower", label: "Tower" }
];

const speedPresets = [0.5, 1, 2, 4];

const mapPresets = [
  { width: 8, height: 8, label: "8 x 8" },
  { width: 12, height: 12, label: "12 x 12" },
  { width: 16, height: 16, label: "16 x 16" }
];

export function Inspector({ project, dispatch }: Props) {
  const [speedDraft, setSpeedDraft] = useState(() => formatInspectorNumber(project.editorState.speed));
  const [speedHint, setSpeedHint] = useState<string | null>(null);
  const [widthDraft, setWidthDraft] = useState(() => `${project.map.width}`);
  const [heightDraft, setHeightDraft] = useState(() => `${project.map.height}`);
  const [widthHint, setWidthHint] = useState<string | null>(null);
  const [heightHint, setHeightHint] = useState<string | null>(null);

  useEffect(() => {
    setSpeedDraft(formatInspectorNumber(project.editorState.speed));
    setSpeedHint(null);
  }, [project.editorState.speed]);

  useEffect(() => {
    setWidthDraft(`${project.map.width}`);
    setHeightDraft(`${project.map.height}`);
    setWidthHint(null);
    setHeightHint(null);
  }, [project.map.width, project.map.height]);

  const commitSpeed = () => {
    const result = commitSpeedDraft(speedDraft, project.editorState.speed);
    setSpeedHint(result.message);
    if (result.blocked) {
      return;
    }
    setSpeedDraft(formatInspectorNumber(result.value));
    dispatch({ type: "set-speed", speed: result.value });
  };

  const onMapDraftChange = (axis: MapAxis, raw: string) => {
    if (axis === "width") {
      setWidthDraft(raw);
      setWidthHint(getMapSizeDraftHint(raw, axis));
      return;
    }
    setHeightDraft(raw);
    setHeightHint(getMapSizeDraftHint(raw, axis));
  };

  const applyMapSize = () => {
    const widthResult = commitMapSizeDraft(widthDraft, project.map.width, "width");
    const heightResult = commitMapSizeDraft(heightDraft, project.map.height, "height");
    setWidthHint(widthResult.message);
    setHeightHint(heightResult.message);

    if (widthResult.blocked || heightResult.blocked) {
      return;
    }

    setWidthDraft(`${widthResult.value}`);
    setHeightDraft(`${heightResult.value}`);
    dispatch({ type: "set-map-size", width: widthResult.value, height: heightResult.value });
  };

  const onMapSizeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyMapSize();
  };

  return (
    <div className="panel inspector-panel">
      <h3>Inspector</h3>
      <section className="inspector-section">
        <h4>Paint Tool</h4>
        <div className="tool-grid" role="radiogroup" aria-label="Paint tool">
          {toolOptions.map((option) => (
            <label
              key={option.tool}
              className={`tool-option${project.editorState.selectedTool === option.tool ? " active" : ""}`}
              htmlFor={`inspector-tool-${option.tool}`}
            >
              <input
                id={`inspector-tool-${option.tool}`}
                type="radio"
                name="inspector-tool"
                value={option.tool}
                checked={project.editorState.selectedTool === option.tool}
                onChange={() => dispatch({ type: "set-tool", tool: option.tool })}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>
      <section className="inspector-section">
        <h4>Preview</h4>
        <div className="field-row">
          <label htmlFor="inspector-speed">Preview Speed</label>
          <input
            id="inspector-speed"
            type="number"
            min={INSPECTOR_SPEED_MIN}
            max={INSPECTOR_SPEED_MAX}
            step={INSPECTOR_SPEED_STEP}
            value={speedDraft}
            onChange={(event) => {
              const nextDraft = event.target.value;
              setSpeedDraft(nextDraft);
              setSpeedHint(getSpeedDraftHint(nextDraft));
            }}
            onBlur={commitSpeed}
          />
        </div>
        {speedHint ? (
          <div className="small field-hint" role="status">
            {speedHint}
          </div>
        ) : null}
        <div className="preset-row" aria-label="Preview speed presets">
          {speedPresets.map((preset) => (
            <button
              type="button"
              key={preset}
              className={`secondary chip${project.editorState.speed === preset ? " selected" : ""}`}
              onClick={() => {
                setSpeedDraft(formatInspectorNumber(preset));
                setSpeedHint(null);
                dispatch({ type: "set-speed", speed: preset });
              }}
            >
              {formatInspectorNumber(preset)}x
            </button>
          ))}
        </div>
      </section>
      <section className="inspector-section">
        <h4>Map Size</h4>
        <form className="map-size-form" onSubmit={onMapSizeSubmit}>
          <div className="field-row">
            <label htmlFor="inspector-map-width">Width</label>
            <input
              id="inspector-map-width"
              type="number"
              min={INSPECTOR_MAP_SIZE_MIN}
              max={INSPECTOR_MAP_SIZE_MAX}
              step={1}
              value={widthDraft}
              onChange={(event) => onMapDraftChange("width", event.target.value)}
              onBlur={() => setWidthHint(getMapSizeDraftHint(widthDraft, "width"))}
            />
          </div>
          {widthHint ? (
            <div className="small field-hint" role="status">
              {widthHint}
            </div>
          ) : null}
          <div className="field-row">
            <label htmlFor="inspector-map-height">Height</label>
            <input
              id="inspector-map-height"
              type="number"
              min={INSPECTOR_MAP_SIZE_MIN}
              max={INSPECTOR_MAP_SIZE_MAX}
              step={1}
              value={heightDraft}
              onChange={(event) => onMapDraftChange("height", event.target.value)}
              onBlur={() => setHeightHint(getMapSizeDraftHint(heightDraft, "height"))}
            />
          </div>
          {heightHint ? (
            <div className="small field-hint" role="status">
              {heightHint}
            </div>
          ) : null}
          <div className="row">
            <button type="submit">Apply Size</button>
          </div>
        </form>
        <div className="preset-row" aria-label="Map size presets">
          {mapPresets.map((preset) => (
            <button
              type="button"
              key={preset.label}
              className="secondary chip"
              onClick={() => {
                setWidthDraft(`${preset.width}`);
                setHeightDraft(`${preset.height}`);
                setWidthHint(null);
                setHeightHint(null);
                dispatch({ type: "set-map-size", width: preset.width, height: preset.height });
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>
      <div className="small">Map: {project.map.width} x {project.map.height}</div>
      <div className="small">Path Nodes: {project.templatePayload.path.length}</div>
      <div className="small">Tower Count: {project.templatePayload.towers.length}</div>
    </div>
  );
}
