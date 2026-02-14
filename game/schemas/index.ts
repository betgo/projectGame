import Ajv2020 from "ajv/dist/2020";
import type { ErrorObject } from "ajv";

import gamePackageSchema from "./game-package.schema.json";
import gameProjectSchema from "./game-project.schema.json";
import towerDefenseSchema from "./tower-defense.schema.json";

const ajv = new Ajv2020({ allErrors: true, strict: false });

ajv.addSchema(towerDefenseSchema, "tower-defense.schema.json");
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
  return toReport(valid, validate.errors);
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
  return toReport(valid, validate.errors);
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
