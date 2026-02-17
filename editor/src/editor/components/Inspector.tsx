import type { Dispatch, FormEvent } from "react";
import { useEffect, useState } from "react";

import type { GameProject } from "@runtime/core/types";

import {
  commitMapSizeDraft,
  commitSpeedDraft,
  formatInspectorNumber,
  getInspectorToolOptions,
  getMapSizeDraftHint,
  getSpeedDraftHint,
  getTemplateOptions,
  INSPECTOR_MAP_SIZE_MAX,
  INSPECTOR_MAP_SIZE_MIN,
  INSPECTOR_SPEED_MAX,
  INSPECTOR_SPEED_MIN,
  INSPECTOR_SPEED_STEP,
  sanitizeTemplateSelection,
  type MapAxis
} from "../inspector-form";
import type { EditorOperation } from "../operations";
import {
  getProjectTemplateId,
  getRpgPayload,
  type SupportedTemplateId,
  type TemplateSwitchWarning
} from "../template-switch";

type PendingTemplateSwitch = {
  targetTemplateId: SupportedTemplateId;
  warnings: TemplateSwitchWarning[];
};

type Props = {
  project: GameProject;
  dispatch: Dispatch<EditorOperation>;
  pendingTemplateSwitch: PendingTemplateSwitch | null;
  onTemplateSwitchRequest: (templateId: SupportedTemplateId) => void;
  onTemplateSwitchConfirm: () => void;
  onTemplateSwitchCancel: () => void;
};

const speedPresets = [0.5, 1, 2, 4];

const mapPresets = [
  { width: 8, height: 8, label: "8 x 8" },
  { width: 12, height: 12, label: "12 x 12" },
  { width: 16, height: 16, label: "16 x 16" }
];

export function Inspector({
  project,
  dispatch,
  pendingTemplateSwitch,
  onTemplateSwitchRequest,
  onTemplateSwitchConfirm,
  onTemplateSwitchCancel
}: Props) {
  const templateId = getProjectTemplateId(project);
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

  const toolOptions = getInspectorToolOptions(templateId);
  const templateOptions = getTemplateOptions();
  const selectedTool = project.editorState.selectedTool;
  const rpgPayload = templateId === "rpg-topdown" ? getRpgPayload(project) : null;
  const templateSelectValue = pendingTemplateSwitch?.targetTemplateId ?? templateId;

  return (
    <div className="panel inspector-panel">
      <h3>Inspector</h3>
      <section className="inspector-section">
        <h4>Template</h4>
        <div className="field-row">
          <label htmlFor="inspector-template">Mode</label>
          <select
            id="inspector-template"
            value={templateSelectValue}
            onChange={(event) => {
              const nextTemplate = sanitizeTemplateSelection(event.target.value, templateId);
              if (nextTemplate !== templateId) {
                onTemplateSwitchRequest(nextTemplate);
              }
            }}
          >
            {templateOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {pendingTemplateSwitch ? (
          <div className="switch-warning-block" role="status" aria-live="polite">
            {pendingTemplateSwitch.warnings.map((warning) => (
              <div className="small field-hint" key={`${warning.code}-${warning.path}`}>
                {warning.message}
              </div>
            ))}
            <div className="small">Apply switch to {pendingTemplateSwitch.targetTemplateId}?</div>
            <div className="row">
              <button type="button" onClick={onTemplateSwitchConfirm}>
                Confirm Switch
              </button>
              <button type="button" className="secondary" onClick={onTemplateSwitchCancel}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>
      <section className="inspector-section">
        <h4>Paint Tool</h4>
        <div className="tool-grid" role="radiogroup" aria-label="Paint tool">
          {toolOptions.map((option) => (
            <label
              key={option.tool}
              className={`tool-option${selectedTool === option.tool ? " active" : ""}`}
              htmlFor={`inspector-tool-${option.tool}`}
            >
              <input
                id={`inspector-tool-${option.tool}`}
                type="radio"
                name="inspector-tool"
                value={option.tool}
                checked={selectedTool === option.tool}
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
      <div className="small">Template: {templateId}</div>
      <div className="small">
        Map: {project.map.width} x {project.map.height}
      </div>
      {templateId === "tower-defense" ? (
        <>
          <div className="small">Path Nodes: {project.templatePayload.path.length}</div>
          <div className="small">Tower Count: {project.templatePayload.towers.length}</div>
        </>
      ) : (
        <>
          <div className="small">Walkable Tiles: {rpgPayload?.map.walkableTiles.length ?? 0}</div>
          <div className="small">Spawn Zones: {rpgPayload?.map.spawnZones.length ?? 0}</div>
        </>
      )}
    </div>
  );
}
