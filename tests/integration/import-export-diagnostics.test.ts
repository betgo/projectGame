import { describe, expect, it } from "vitest";

import {
  createProject,
  exportPackage,
  exportPackageWithDiagnostics,
  importProjectFromJson,
  loadProject
} from "@editor/editor/api";
import { validateGamePackage } from "@game/schemas/index";
import { validateTowerDefensePackage } from "@runtime/templates/tower-defense/validator";

describe("import-export diagnostics integration", () => {
  it("returns actionable parse diagnostics for malformed JSON", () => {
    const result = importProjectFromJson('{"meta":');

    expect(result.ok).toBe(false);
    expect(result.project).toBeNull();
    expect(result.report.valid).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      code: "import.parse.invalid-json",
      path: "/",
      severity: "error",
      source: "editor/api"
    });
    expect(result.diagnostics[0]?.hint).toContain("JSON syntax");
  });

  it("surfaces schema diagnostics with code/path/hint for missing required fields", () => {
    const result = importProjectFromJson(JSON.stringify({ templateId: "tower-defense" }));

    expect(result.ok).toBe(false);

    const requiredDiagnostic = result.diagnostics.find((diagnostic) => diagnostic.code === "import.schema.required");
    expect(requiredDiagnostic).toBeDefined();
    expect(requiredDiagnostic?.path.startsWith("/")).toBe(true);
    expect(requiredDiagnostic?.severity).toBe("error");
    expect(requiredDiagnostic?.source).toBe("game/schemas");
    expect(requiredDiagnostic?.hint).toContain("missing required field");
  });

  it("classifies enum-like schema errors with actionable diagnostics", () => {
    const project = createProject("tower-defense");
    project.editorState.selectedTool = "laser" as never;

    const result = loadProject(project);

    expect(result.ok).toBe(false);

    const enumDiagnostic = result.diagnostics.find((diagnostic) => diagnostic.code === "import.schema.enum");
    expect(enumDiagnostic).toBeDefined();
    expect(enumDiagnostic?.path).toBe("/editorState/selectedTool");
    expect(enumDiagnostic?.source).toBe("game/schemas");
    expect(enumDiagnostic?.hint).toContain("allowed enum values");
  });

  it("returns semantic diagnostics for payload mismatches", () => {
    const project = createProject("tower-defense");
    project.templatePayload.waves[0] = {
      ...project.templatePayload.waves[0],
      enemyId: "ghost"
    };

    const result = loadProject(project);

    expect(result.ok).toBe(false);

    const semanticDiagnostic = result.diagnostics.find(
      (diagnostic) => diagnostic.code === "import.semantic.unknown-reference"
    );
    expect(semanticDiagnostic).toBeDefined();
    expect(semanticDiagnostic).toMatchObject({
      path: "/templatePayload/waves/0/enemyId",
      severity: "error",
      source: "runtime/templates/tower-defense"
    });
    expect(semanticDiagnostic?.hint).toContain("grunt");
  });

  it("keeps export deterministic and schema-valid for identical input", () => {
    const project = createProject("tower-defense");

    const first = exportPackage(project);
    const second = exportPackage(project);
    const diagnosticsResult = exportPackageWithDiagnostics(project);

    expect(second).toEqual(first);
    expect(validateGamePackage(first).valid).toBe(true);
    expect(validateTowerDefensePackage(first).valid).toBe(true);
    expect(diagnosticsResult.ok).toBe(true);
    expect(diagnosticsResult.pkg).toEqual(first);
    expect(diagnosticsResult.report).toEqual({ valid: true, issues: [] });
    expect(diagnosticsResult.diagnostics).toEqual([]);
  });

  it("returns export diagnostics with the same contract when semantic validation fails", () => {
    const project = createProject("tower-defense");
    project.templatePayload.waves[0] = {
      ...project.templatePayload.waves[0],
      enemyId: "ghost"
    };

    const result = exportPackageWithDiagnostics(project);

    expect(result.ok).toBe(false);

    const semanticDiagnostic = result.diagnostics.find(
      (diagnostic) => diagnostic.code === "export.semantic.unknown-reference"
    );
    expect(semanticDiagnostic).toBeDefined();
    expect(semanticDiagnostic).toMatchObject({
      path: "/templatePayload/waves/0/enemyId",
      severity: "error",
      source: "runtime/templates/tower-defense"
    });
  });
});
