import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { validateGamePackage } from "@game/schemas/index";
import { exportPackage } from "@editor/editor/api";
import {
  isBrushPointerActive,
  MapCanvas,
  resolvePointerBrushTool
} from "@editor/editor/components/MapCanvas";
import { applyOperation } from "@editor/editor/operations";
import { createDefaultProject } from "@editor/editor/store";
import { validateTowerDefensePackage } from "@runtime/templates/tower-defense/validator";

describe("map editing ergonomics", () => {
  it("maps pointer buttons to deterministic brush actions", () => {
    expect(resolvePointerBrushTool(0, "path")).toBe("path");
    expect(resolvePointerBrushTool(0, "tower")).toBe("tower");
    expect(resolvePointerBrushTool(2, "tower")).toBe("empty");
    expect(resolvePointerBrushTool(1, "tower")).toBeNull();

    expect(isBrushPointerActive(1)).toBe(true);
    expect(isBrushPointerActive(2)).toBe(true);
    expect(isBrushPointerActive(3)).toBe(true);
    expect(isBrushPointerActive(0)).toBe(false);
  });

  it("keeps paint operations idempotent and supports explicit erase", () => {
    const project = createDefaultProject();

    const unchangedPath = applyOperation(project, { type: "paint-cell", x: 0, y: 5, tool: "path" });
    expect(unchangedPath.ok).toBe(true);
    expect(unchangedPath.project).toBe(project);

    const erasedTower = applyOperation(project, { type: "paint-cell", x: 4, y: 4, tool: "empty" });
    expect(erasedTower.ok).toBe(true);
    expect(erasedTower.project.map.cells[4]?.[4]).toBe(0);
    expect(erasedTower.project.templatePayload.towers).toHaveLength(0);

    const unchangedErase = applyOperation(erasedTower.project, {
      type: "paint-cell",
      x: 4,
      y: 4,
      tool: "empty"
    });
    expect(unchangedErase.project).toBe(erasedTower.project);
  });

  it("syncs reversible path and tower transitions on repeated edits", () => {
    const project = createDefaultProject();

    const paintedPath = applyOperation(project, { type: "paint-cell", x: 1, y: 1, tool: "path" }).project;
    expect(paintedPath.map.cells[1]?.[1]).toBe(1);
    expect(paintedPath.templatePayload.path).toContainEqual({ x: 1, y: 1 });

    const paintedTower = applyOperation(paintedPath, {
      type: "paint-cell",
      x: 1,
      y: 1,
      tool: "tower"
    }).project;
    expect(paintedTower.map.cells[1]?.[1]).toBe(2);
    expect(paintedTower.templatePayload.path).not.toContainEqual({ x: 1, y: 1 });
    expect(paintedTower.templatePayload.towers).toContainEqual(
      expect.objectContaining({ id: "tower-1-1", x: 1, y: 1 })
    );

    const erasedCell = applyOperation(paintedTower, { type: "paint-cell", x: 1, y: 1, tool: "empty" }).project;
    expect(erasedCell.map.cells[1]?.[1]).toBe(0);
    expect(erasedCell.templatePayload.path).not.toContainEqual({ x: 1, y: 1 });
    expect(erasedCell.templatePayload.towers).not.toContainEqual(
      expect.objectContaining({ id: "tower-1-1" })
    );
  });

  it("keeps path payload reversible when every path cell is erased", () => {
    const project = createDefaultProject();
    const originalPath = [...project.templatePayload.path];

    const cleared = originalPath.reduce(
      (state, point) =>
        applyOperation(state, { type: "paint-cell", x: point.x, y: point.y, tool: "empty" }).project,
      project
    );

    expect(cleared.templatePayload.path).toEqual([]);
    expect(cleared.map.cells.flat().every((cell) => cell !== 1)).toBe(true);
    expect(validateGamePackage(exportPackage(cleared)).valid).toBe(false);
  });

  it("preserves export contract compatibility after ergonomic brush edits", () => {
    const project = createDefaultProject();
    const pathEdited = applyOperation(project, { type: "paint-cell", x: 1, y: 5, tool: "path" }).project;
    const towerEdited = applyOperation(pathEdited, { type: "paint-cell", x: 2, y: 2, tool: "tower" }).project;

    const pkg = exportPackage(towerEdited);
    expect(pkg.map).toEqual(towerEdited.map);
    expect(pkg.rules.payload.path).toEqual(towerEdited.templatePayload.path);
    expect(pkg.rules.payload.towers).toEqual(towerEdited.templatePayload.towers);
    expect(pkg.entities.towers).toEqual(towerEdited.templatePayload.towers);

    expect(validateGamePackage(pkg).valid).toBe(true);
    expect(validateTowerDefensePackage(pkg).valid).toBe(true);
  });

  it("renders map canvas with brush ergonomics hints and deterministic cell labels", () => {
    const html = renderToStaticMarkup(
      createElement(MapCanvas, {
        project: createDefaultProject(),
        dispatch: () => undefined
      })
    );

    expect(html).toContain("Brush: path");
    expect(html).toContain("Left-drag paints selected tool. Right-drag erases to empty.");
    expect(html).toContain("Target: none");
    expect(html).toContain('class="grid map-grid"');
    expect(html).toContain('aria-label="Cell (0, 0) empty"');
    expect(html).toContain('aria-label="Cell (0, 5) path"');
    expect(html).toContain('aria-label="Cell (4, 4) tower"');
  });
});
