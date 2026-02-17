import { describe, expect, it } from "vitest";

import {
  applyTemplateSwitch,
  createProject,
  exportPackageWithDiagnostics,
  loadProject,
  previewTemplateSwitch
} from "@editor/editor/api";
import { getInspectorToolOptions, resolvePayloadPanelMode } from "@editor/editor/inspector-form";
import { applyOperation } from "@editor/editor/operations";
import { getRpgPayload } from "@editor/editor/template-switch";
import { validateGamePackage, validateGameProject } from "@game/schemas/index";
import { validateRuntimePackage } from "@runtime/core/engine";
import { validateTowerDefensePackage } from "@runtime/templates/tower-defense/validator";

describe("editor template switching", () => {
  it("surfaces deterministic warnings and supports cancellation before mutation", () => {
    const project = createProject("tower-defense");

    const preview = previewTemplateSwitch(project, "rpg-topdown");
    const cancelled = applyTemplateSwitch(project, "rpg-topdown", false);
    const opResult = applyOperation(project, {
      type: "switch-template",
      templateId: "rpg-topdown",
      force: false
    });

    expect(preview.requiresConfirmation).toBe(true);
    expect(preview.warnings.some((warning) => warning.code === "switch.compatibility.payload-reset")).toBe(true);
    expect(cancelled.applied).toBe(false);
    expect(cancelled.project).toBe(project);
    expect(opResult.ok).toBe(false);
    expect(opResult.project).toBe(project);
    expect(opResult.message).toContain("requires confirmation");
  });

  it("switches td -> rpg with confirmation and keeps import/export contracts valid", () => {
    const project = createProject("tower-defense");

    const switched = applyOperation(project, {
      type: "switch-template",
      templateId: "rpg-topdown",
      force: true
    });

    expect(switched.ok).toBe(true);
    expect(switched.project.templateId).toBe("rpg-topdown");
    expect(validateGameProject(switched.project).valid).toBe(true);
    expect(loadProject(switched.project).ok).toBe(true);

    const exported = exportPackageWithDiagnostics(switched.project);
    expect(exported.ok).toBe(true);
    expect(exported.pkg.templateId).toBe("rpg-topdown");
    expect(validateGamePackage(exported.pkg).valid).toBe(true);
    expect(validateRuntimePackage(exported.pkg).valid).toBe(true);
  });

  it("normalizes tower-only td maps before switching to rpg export", () => {
    const project = createProject("tower-defense");
    let towerOnly = project;
    for (let y = 0; y < towerOnly.map.height; y += 1) {
      for (let x = 0; x < towerOnly.map.width; x += 1) {
        towerOnly = applyOperation(towerOnly, { type: "paint-cell", x, y, tool: "tower" }).project;
      }
    }

    const switched = applyOperation(towerOnly, {
      type: "switch-template",
      templateId: "rpg-topdown",
      force: true
    });
    const payload = getRpgPayload(switched.project);
    const exported = exportPackageWithDiagnostics(switched.project);
    const exitCell = switched.project.map.cells[payload.map.exit.y]?.[payload.map.exit.x] ?? -1;

    expect(switched.ok).toBe(true);
    expect(payload.map.walkableTiles).toContain(2);
    expect(payload.map.walkableTiles).toContain(exitCell);
    expect(exported.ok).toBe(true);
  });

  it("switches rpg -> td with remap warning and preserves tower-defense export validity", () => {
    const project = createProject("rpg-topdown");
    const withEntityPaint = applyOperation(project, {
      type: "paint-cell",
      x: 1,
      y: 1,
      tool: "entity"
    }).project;

    const preview = previewTemplateSwitch(withEntityPaint, "tower-defense");
    const switched = applyOperation(withEntityPaint, {
      type: "switch-template",
      templateId: "tower-defense",
      force: true
    });

    expect(preview.warnings.some((warning) => warning.code === "switch.compatibility.cell-remap")).toBe(true);
    expect(switched.ok).toBe(true);
    expect(switched.project.templateId).toBe("tower-defense");
    expect(switched.project.map.cells.flat().every((cell) => cell <= 2)).toBe(true);
    expect(validateGameProject(switched.project).valid).toBe(true);

    const exported = exportPackageWithDiagnostics(switched.project);
    expect(exported.ok).toBe(true);
    expect(validateGamePackage(exported.pkg).valid).toBe(true);
    expect(validateTowerDefensePackage(exported.pkg).valid).toBe(true);
  });

  it("preserves schema and runtime validity in td -> rpg -> td round-trip switches", () => {
    const project = createProject("tower-defense");
    const toRpg = applyOperation(project, {
      type: "switch-template",
      templateId: "rpg-topdown",
      force: true
    }).project;
    const backToTd = applyOperation(toRpg, {
      type: "switch-template",
      templateId: "tower-defense",
      force: true
    }).project;

    expect(backToTd.templateId).toBe("tower-defense");
    expect(validateGameProject(backToTd).valid).toBe(true);
    const exported = exportPackageWithDiagnostics(backToTd);
    expect(exported.ok).toBe(true);
    expect(validateGamePackage(exported.pkg).valid).toBe(true);
    expect(validateRuntimePackage(exported.pkg).valid).toBe(true);
  });

  it("routes payload panels and tool options by template id", () => {
    expect(resolvePayloadPanelMode("tower-defense")).toBe("tower-defense");
    expect(resolvePayloadPanelMode("rpg-topdown")).toBe("rpg-topdown");

    const tdTools = getInspectorToolOptions("tower-defense").map((option) => option.tool);
    const rpgTools = getInspectorToolOptions("rpg-topdown").map((option) => option.tool);

    expect(tdTools).toEqual(["empty", "path", "tower"]);
    expect(rpgTools).toEqual(["terrain", "spawn", "entity"]);
  });

  it("rejects unsupported template switch operations without mutating state", () => {
    const project = createProject("tower-defense");
    const result = applyOperation(project, {
      type: "switch-template",
      templateId: "unknown-template",
      force: true
    });

    expect(result.ok).toBe(false);
    expect(result.project).toBe(project);
    expect(result.message).toContain("unsupported template");
  });
});
