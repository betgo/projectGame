import { describe, expect, it } from "vitest";

import {
  CURRENT_SCHEMA_VERSION,
  classifySchemaVersionBump,
  normalizeGamePackageSchemaVersion,
  normalizeGameProjectSchemaVersion,
  parseSchemaVersion,
  validateGamePackageSchemaVersion,
  validateGameProjectSchemaVersion
} from "@game/schemas/index";

function requireParsed(version: string) {
  const parsed = parseSchemaVersion(version);
  if (!parsed) {
    throw new Error(`invalid test schema version: ${version}`);
  }
  return parsed;
}

describe("schema versioning contract", () => {
  it("parses strict semver strings only", () => {
    expect(parseSchemaVersion("0.2.0")).toEqual({
      major: 0,
      minor: 2,
      patch: 0,
      raw: "0.2.0",
      normalized: "0.2.0"
    });
    expect(parseSchemaVersion("0.2")).toBeNull();
    expect(parseSchemaVersion("v0.2.0")).toBeNull();
    expect(parseSchemaVersion("0.2.0 ")).toBeNull();
  });

  it("accepts current and previous minor versions for package/project contracts", () => {
    const current = requireParsed(CURRENT_SCHEMA_VERSION);
    const legacyMinor = Math.max(0, current.minor - 1);
    const legacyVersion = `${current.major}.${legacyMinor}.9`;

    expect(validateGamePackageSchemaVersion(CURRENT_SCHEMA_VERSION)).toEqual({
      valid: true,
      issues: []
    });
    expect(validateGameProjectSchemaVersion(legacyVersion)).toEqual({
      valid: true,
      issues: []
    });
  });

  it("rejects malformed, unsupported-major, future-minor, and stale-minor versions", () => {
    const current = requireParsed(CURRENT_SCHEMA_VERSION);

    const malformed = validateGamePackageSchemaVersion("0.2");
    expect(malformed.valid).toBe(false);
    expect(malformed.issues[0]).toEqual({
      path: "/version",
      message: "schema version must match semver format <major>.<minor>.<patch>"
    });

    const unsupportedMajor = validateGameProjectSchemaVersion(`${current.major + 1}.0.0`);
    expect(unsupportedMajor.valid).toBe(false);
    expect(unsupportedMajor.issues[0]?.message).toContain("unsupported schema major version");

    const futureMinor = validateGamePackageSchemaVersion(`${current.major}.${current.minor + 1}.0`);
    expect(futureMinor.valid).toBe(false);
    expect(futureMinor.issues[0]?.message).toContain("latest supported minor");

    const staleMinor = validateGameProjectSchemaVersion(`${current.major}.${Math.max(0, current.minor - 2)}.0`);
    expect(staleMinor.valid).toBe(false);
    expect(staleMinor.issues[0]?.message).toContain("minimum migratable minor");
  });

  it("classifies patch/minor/major bumps with compatibility flags", () => {
    expect(classifySchemaVersionBump("0.2.0", "0.2.4")).toEqual({
      bump: "patch",
      compatible: true,
      direction: "upgrade"
    });
    expect(classifySchemaVersionBump("0.1.9", "0.2.0")).toEqual({
      bump: "minor",
      compatible: true,
      direction: "upgrade"
    });
    expect(classifySchemaVersionBump("0.0.1", "0.2.0")).toEqual({
      bump: "minor",
      compatible: false,
      direction: "upgrade"
    });
    expect(classifySchemaVersionBump("0.2.0", "1.0.0")).toEqual({
      bump: "major",
      compatible: false,
      direction: "upgrade"
    });
    expect(classifySchemaVersionBump("0.2.3", "0.2.1")).toEqual({
      bump: "patch",
      compatible: false,
      direction: "downgrade"
    });
  });

  it("migrates one adjacent minor step without mutating source payload", () => {
    const current = requireParsed(CURRENT_SCHEMA_VERSION);
    const legacyVersion = `${current.major}.${Math.max(0, current.minor - 1)}.5`;
    const pkg = { version: legacyVersion, templateId: "tower-defense" };

    const migratedPkg = normalizeGamePackageSchemaVersion(pkg);
    expect(migratedPkg.ok).toBe(true);
    if (!migratedPkg.ok) {
      throw new Error("expected package migration to pass");
    }

    expect(migratedPkg.migrated).toBe(true);
    expect(migratedPkg.fromVersion).toBe(legacyVersion);
    expect(migratedPkg.toVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migratedPkg.value.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(pkg.version).toBe(legacyVersion);

    const unsupportedProject = {
      meta: {
        version: `${current.major}.${current.minor + 2}.0`
      }
    };
    const projectResult = normalizeGameProjectSchemaVersion(unsupportedProject);
    expect(projectResult.ok).toBe(false);
    if (projectResult.ok) {
      throw new Error("expected unsupported project version to fail");
    }
    expect(projectResult.issues[0]).toMatchObject({ path: "/meta/version" });
  });
});
