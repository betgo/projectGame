import Ajv2020 from "ajv/dist/2020";
import type { ErrorObject } from "ajv";

import gamePackageSchema from "./game-package.schema.json";
import gameProjectSchema from "./game-project.schema.json";
import rpgTopdownSchema from "./rpg-topdown.schema.json";
import towerDefenseSchema from "./tower-defense.schema.json";

const ajv = new Ajv2020({ allErrors: true, strict: false });

ajv.addSchema(towerDefenseSchema, "tower-defense.schema.json");
ajv.addSchema(rpgTopdownSchema, "rpg-topdown.schema.json");
ajv.addSchema(gameProjectSchema, "game-project.schema.json");
ajv.addSchema(gamePackageSchema, "game-package.schema.json");

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationReport = {
  valid: boolean;
  issues: ValidationIssue[];
};

export const CURRENT_SCHEMA_VERSION = "0.2.0";
export const SCHEMA_MIGRATION_MINOR_WINDOW = 1;

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export type ParsedSchemaVersion = {
  major: number;
  minor: number;
  patch: number;
  raw: string;
  normalized: string;
};

export type SchemaVersionBump = "patch" | "minor" | "major";

export type SchemaVersionChange = {
  bump: SchemaVersionBump;
  compatible: boolean;
  direction: "upgrade" | "downgrade" | "none";
};

export type SchemaVersionNormalizationResult<T> =
  | {
      ok: true;
      value: T;
      migrated: boolean;
      fromVersion: string;
      toVersion: string;
    }
  | {
      ok: false;
      issues: ValidationIssue[];
    };

const currentSchemaVersion = mustParseSchemaVersion(CURRENT_SCHEMA_VERSION);
const minimumMigratableMinor = Math.max(
  0,
  currentSchemaVersion.minor - SCHEMA_MIGRATION_MINOR_WINDOW
);

function mustParseSchemaVersion(version: string): ParsedSchemaVersion {
  const parsed = parseSchemaVersion(version);
  if (!parsed) {
    throw new Error(`invalid CURRENT_SCHEMA_VERSION: ${version}`);
  }
  return parsed;
}

export function parseSchemaVersion(version: string): ParsedSchemaVersion | null {
  const match = SEMVER_PATTERN.exec(version);
  if (!match) {
    return null;
  }

  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt(match[2], 10);
  const patch = Number.parseInt(match[3], 10);

  return {
    major,
    minor,
    patch,
    raw: version,
    normalized: `${major}.${minor}.${patch}`
  };
}

export function classifySchemaVersionBump(
  fromVersion: string,
  toVersion: string
): SchemaVersionChange | null {
  const from = parseSchemaVersion(fromVersion);
  const to = parseSchemaVersion(toVersion);
  if (!from || !to) {
    return null;
  }

  if (from.major !== to.major) {
    return {
      bump: "major",
      compatible: false,
      direction: to.major > from.major ? "upgrade" : "downgrade"
    };
  }

  if (from.minor !== to.minor) {
    const direction = to.minor > from.minor ? "upgrade" : "downgrade";
    return {
      bump: "minor",
      compatible: direction === "upgrade" && to.minor - from.minor === 1,
      direction
    };
  }

  if (from.patch !== to.patch) {
    return {
      bump: "patch",
      compatible: to.patch >= from.patch,
      direction: to.patch > from.patch ? "upgrade" : "downgrade"
    };
  }

  return {
    bump: "patch",
    compatible: true,
    direction: "none"
  };
}

type VersionSupport =
  | {
      ok: true;
      state: "current" | "migratable";
      parsed: ParsedSchemaVersion;
    }
  | {
      ok: false;
      issue: ValidationIssue;
    };

function resolveVersionSupport(version: string, path: string): VersionSupport {
  const parsed = parseSchemaVersion(version);
  if (!parsed) {
    return {
      ok: false,
      issue: {
        path,
        message: "schema version must match semver format <major>.<minor>.<patch>"
      }
    };
  }

  if (parsed.major !== currentSchemaVersion.major) {
    return {
      ok: false,
      issue: {
        path,
        message: `unsupported schema major version: ${parsed.major}. expected ${currentSchemaVersion.major}`
      }
    };
  }

  if (parsed.minor === currentSchemaVersion.minor) {
    return {
      ok: true,
      state: "current",
      parsed
    };
  }

  if (parsed.minor === currentSchemaVersion.minor - SCHEMA_MIGRATION_MINOR_WINDOW) {
    return {
      ok: true,
      state: "migratable",
      parsed
    };
  }

  if (parsed.minor > currentSchemaVersion.minor) {
    return {
      ok: false,
      issue: {
        path,
        message: `unsupported schema minor version: ${parsed.minor}. latest supported minor is ${currentSchemaVersion.minor}`
      }
    };
  }

  return {
    ok: false,
    issue: {
      path,
      message: `unsupported schema minor version: ${parsed.minor}. minimum migratable minor is ${minimumMigratableMinor}`
    }
  };
}

function versionSupportToReport(support: VersionSupport): ValidationReport {
  if (support.ok) {
    return { valid: true, issues: [] };
  }

  return {
    valid: false,
    issues: [support.issue]
  };
}

export function validateGameProjectSchemaVersion(version: string): ValidationReport {
  return versionSupportToReport(resolveVersionSupport(version, "/meta/version"));
}

export function validateGamePackageSchemaVersion(version: string): ValidationReport {
  return versionSupportToReport(resolveVersionSupport(version, "/version"));
}

type VersionedProjectLike = {
  meta: {
    version: string;
  };
};

type VersionedPackageLike = {
  version: string;
};

export function normalizeGameProjectSchemaVersion<T extends VersionedProjectLike>(
  project: T
): SchemaVersionNormalizationResult<T> {
  const support = resolveVersionSupport(project.meta.version, "/meta/version");
  if (!support.ok) {
    return {
      ok: false,
      issues: [support.issue]
    };
  }

  if (support.state === "current") {
    return {
      ok: true,
      value: project,
      migrated: false,
      fromVersion: project.meta.version,
      toVersion: project.meta.version
    };
  }

  return {
    ok: true,
    value: {
      ...project,
      meta: {
        ...project.meta,
        version: CURRENT_SCHEMA_VERSION
      }
    } as T,
    migrated: true,
    fromVersion: project.meta.version,
    toVersion: CURRENT_SCHEMA_VERSION
  };
}

export function normalizeGamePackageSchemaVersion<T extends VersionedPackageLike>(
  pkg: T
): SchemaVersionNormalizationResult<T> {
  const support = resolveVersionSupport(pkg.version, "/version");
  if (!support.ok) {
    return {
      ok: false,
      issues: [support.issue]
    };
  }

  if (support.state === "current") {
    return {
      ok: true,
      value: pkg,
      migrated: false,
      fromVersion: pkg.version,
      toVersion: pkg.version
    };
  }

  return {
    ok: true,
    value: {
      ...pkg,
      version: CURRENT_SCHEMA_VERSION
    } as T,
    migrated: true,
    fromVersion: pkg.version,
    toVersion: CURRENT_SCHEMA_VERSION
  };
}

function readProjectVersion(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const value = payload as Record<string, unknown>;
  const meta = value.meta;
  if (typeof meta !== "object" || meta === null) {
    return null;
  }
  const version = (meta as Record<string, unknown>).version;
  return typeof version === "string" ? version : null;
}

function readPackageVersion(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const version = (payload as Record<string, unknown>).version;
  return typeof version === "string" ? version : null;
}

function toReport(valid: boolean, errors: ErrorObject[] | null | undefined): ValidationReport {
  return {
    valid,
    issues: (errors ?? []).map((error) => ({
      path: error.instancePath || "/",
      message: error.message ?? "unknown validation error"
    }))
  };
}

export function validateGameProject(payload: unknown): ValidationReport {
  const validate = ajv.getSchema("game-project.schema.json");
  if (!validate) {
    return {
      valid: false,
      issues: [{ path: "/", message: "missing game-project validator" }]
    };
  }
  const valid = Boolean(validate(payload));
  const report = toReport(valid, validate.errors);
  if (!report.valid) {
    return report;
  }

  const version = readProjectVersion(payload);

  if (version === null) {
    return {
      valid: false,
      issues: [{ path: "/meta/version", message: "missing schema version field" }]
    };
  }

  return validateGameProjectSchemaVersion(version);
}

export function validateGamePackage(payload: unknown): ValidationReport {
  const validate = ajv.getSchema("game-package.schema.json");
  if (!validate) {
    return {
      valid: false,
      issues: [{ path: "/", message: "missing game-package validator" }]
    };
  }
  const valid = Boolean(validate(payload));
  const report = toReport(valid, validate.errors);
  if (!report.valid) {
    return report;
  }

  const version = readPackageVersion(payload);

  if (version === null) {
    return {
      valid: false,
      issues: [{ path: "/version", message: "missing schema version field" }]
    };
  }

  return validateGamePackageSchemaVersion(version);
}

export function validateTowerDefensePayload(payload: unknown): ValidationReport {
  const validate = ajv.getSchema("tower-defense.schema.json");
  if (!validate) {
    return {
      valid: false,
      issues: [{ path: "/", message: "missing tower-defense validator" }]
    };
  }
  const valid = Boolean(validate(payload));
  return toReport(valid, validate.errors);
}

export function validateRpgTopdownPayload(payload: unknown): ValidationReport {
  const validate = ajv.getSchema("rpg-topdown.schema.json");
  if (!validate) {
    return {
      valid: false,
      issues: [{ path: "/", message: "missing rpg-topdown validator" }]
    };
  }
  const valid = Boolean(validate(payload));
  return toReport(valid, validate.errors);
}
