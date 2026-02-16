import { describe, expect, it } from "vitest";

import easyPackage from "@game/examples/td-easy.json";
import { CURRENT_SCHEMA_VERSION, parseSchemaVersion } from "@game/schemas/index";
import { createProject, exportPackage, loadProject } from "@editor/editor/api";
import { loadPackage } from "@runtime/core/engine";
import type { GamePackage } from "@runtime/core/types";

function requireCurrentVersion() {
  const parsed = parseSchemaVersion(CURRENT_SCHEMA_VERSION);
  if (!parsed) {
    throw new Error(`invalid CURRENT_SCHEMA_VERSION: ${CURRENT_SCHEMA_VERSION}`);
  }
  return parsed;
}

describe("schema versioning migration integration", () => {
  it("runtime loadPackage migrates one-minor legacy package to current schema", () => {
    const current = requireCurrentVersion();
    const legacyVersion = `${current.major}.${Math.max(0, current.minor - 1)}.7`;
    const legacyPkg = structuredClone(easyPackage as GamePackage);
    legacyPkg.version = legacyVersion;

    const world = loadPackage(legacyPkg, 5);

    expect(world.seed).toBe(5);
    expect(world.pkg.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(legacyPkg.version).toBe(legacyVersion);
    expect(world.pkg.version).not.toBe(legacyPkg.version);
  });

  it("runtime fails fast for unsupported schema versions", () => {
    const current = requireCurrentVersion();

    const futureMinor = structuredClone(easyPackage as GamePackage);
    futureMinor.version = `${current.major}.${current.minor + 1}.0`;
    expect(() => loadPackage(futureMinor, 1)).toThrowError(
      new RegExp(`invalid game package: unsupported schema minor version: ${current.minor + 1}`)
    );

    const unsupportedMajor = structuredClone(easyPackage as GamePackage);
    unsupportedMajor.version = `${current.major + 1}.0.0`;
    expect(() => loadPackage(unsupportedMajor, 1)).toThrowError(
      /invalid game package: unsupported schema major version/
    );
  });

  it("editor loadProject upgrades legacy meta.version and keeps export/runtime in sync", () => {
    const current = requireCurrentVersion();
    const legacyVersion = `${current.major}.${Math.max(0, current.minor - 1)}.3`;
    const project = createProject("tower-defense");
    project.meta.version = legacyVersion;

    const loaded = loadProject(project);

    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      throw new Error("expected legacy project to migrate during load");
    }

    expect(loaded.project).not.toBe(project);
    expect(loaded.project.meta.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(project.meta.version).toBe(legacyVersion);

    const pkg = exportPackage(loaded.project);
    expect(pkg.version).toBe(CURRENT_SCHEMA_VERSION);

    const world = loadPackage(pkg, 11);
    expect(world.pkg.version).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("editor loadProject reports unsupported project versions with version-path diagnostics", () => {
    const current = requireCurrentVersion();
    const project = createProject("tower-defense");
    project.meta.version = `${current.major}.${current.minor + 2}.0`;

    const loaded = loadProject(project);

    expect(loaded.ok).toBe(false);
    expect(loaded.report.valid).toBe(false);
    expect(loaded.report.issues[0]).toMatchObject({ path: "/meta/version" });
    expect(loaded.report.issues[0]?.message).toContain("unsupported schema minor version");
  });
});
