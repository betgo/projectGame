import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Inspector } from "@editor/editor/components/Inspector";
import {
  commitMapSizeDraft,
  commitSpeedDraft,
  getMapSizeDraftHint,
  getSpeedDraftHint,
  INSPECTOR_MAP_SIZE_MAX,
  INSPECTOR_MAP_SIZE_MIN,
  INSPECTOR_SPEED_MAX,
  INSPECTOR_SPEED_MIN
} from "@editor/editor/inspector-form";
import { applyOperation } from "@editor/editor/operations";
import { createDefaultProject } from "@editor/editor/store";

describe("inspector form ux polish", () => {
  it("supports deterministic tool switching through editor operations", () => {
    const project = createDefaultProject();
    const result = applyOperation(project, { type: "set-tool", tool: "tower" });

    expect(result.ok).toBe(true);
    expect(result.project.editorState.selectedTool).toBe("tower");
    expect(project.editorState.selectedTool).toBe("path");
  });

  it("enforces numeric constraints for preview speed and map size", () => {
    const project = createDefaultProject();
    const highSpeed = applyOperation(project, { type: "set-speed", speed: 99 });
    const invalidSpeed = applyOperation(project, { type: "set-speed", speed: Number.NaN });
    const resized = applyOperation(project, { type: "set-map-size", width: 2.2, height: 200 });

    expect(highSpeed.project.editorState.speed).toBe(INSPECTOR_SPEED_MAX);
    expect(invalidSpeed.project.editorState.speed).toBe(project.editorState.speed);
    expect(resized.project.map.width).toBe(INSPECTOR_MAP_SIZE_MIN);
    expect(resized.project.map.height).toBe(INSPECTOR_MAP_SIZE_MAX);
  });

  it("returns localized numeric feedback for invalid or corrected drafts", () => {
    const speedRequired = getSpeedDraftHint("");
    const speedStep = getSpeedDraftHint("1.1");
    const widthRound = getMapSizeDraftHint("9.5", "width");
    const heightRequired = commitMapSizeDraft("", 12, "height");
    const speedCommit = commitSpeedDraft("9.1", 1);

    expect(speedRequired).toContain("required");
    expect(speedStep).toContain("snaps");
    expect(widthRound).toContain("nearest integer");
    expect(heightRequired.blocked).toBe(true);
    expect(heightRequired.message).toContain("required");
    expect(speedCommit.blocked).toBe(false);
    expect(speedCommit.value).toBe(INSPECTOR_SPEED_MAX);
    expect(speedCommit.message).toContain("adjusted");
  });

  it("renders labeled controls in keyboard-friendly tab sequence", () => {
    const html = renderToStaticMarkup(
      createElement(Inspector, {
        project: createDefaultProject(),
        dispatch: () => undefined
      })
    );

    const toolIndex = html.indexOf('name="inspector-tool"');
    const speedIndex = html.indexOf('id="inspector-speed"');
    const widthIndex = html.indexOf('id="inspector-map-width"');
    const heightIndex = html.indexOf('id="inspector-map-height"');
    const submitIndex = html.indexOf('type="submit"');

    expect(toolIndex).toBeGreaterThan(-1);
    expect(speedIndex).toBeGreaterThan(toolIndex);
    expect(widthIndex).toBeGreaterThan(speedIndex);
    expect(heightIndex).toBeGreaterThan(widthIndex);
    expect(submitIndex).toBeGreaterThan(heightIndex);
    expect(html).toContain('for="inspector-speed"');
    expect(html).toContain('for="inspector-map-width"');
    expect(html).toContain('for="inspector-map-height"');
    expect(html).toContain(`min="${INSPECTOR_SPEED_MIN}"`);
    expect(html).toContain(`max="${INSPECTOR_SPEED_MAX}"`);
  });
});
