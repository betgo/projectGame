import { describe, expect, it } from "vitest";

import easyPackage from "@game/examples/td-easy.json";
import {
  createBatchSeeds,
  loadPackage,
  registerTemplate,
  runBatch,
  runScenario,
  validateRuntimePackage
} from "@runtime/core/engine";
import type { GamePackage, RuntimeTemplate } from "@runtime/core/types";
import { createBaseWorld } from "@runtime/core/world";
import { stepTowerDefense } from "@runtime/templates/tower-defense/systems";

let templateCounter = 0;

function nextTemplateId(tag: string): string {
  templateCounter += 1;
  return `sdk-core-${tag}-${templateCounter}`;
}

function createSdkTemplate(templateId: string): RuntimeTemplate {
  return {
    id: templateId,
    validate: (pkg) => {
      if (pkg.rules.payload.path.length < 2) {
        return {
          valid: false,
          issues: [{ path: "/rules/payload/path", message: "path must contain at least two nodes" }]
        };
      }
      return {
        valid: true,
        issues: []
      };
    },
    createWorld: (pkg, seed) => createBaseWorld(pkg, seed),
    step: stepTowerDefense
  };
}

function clonePackageWithTemplate(templateId: string): GamePackage {
  const pkg = structuredClone(easyPackage as GamePackage);
  pkg.templateId = templateId;
  return pkg;
}

describe("template-sdk-core runtime integration", () => {
  it("fails fast when template registration payload is invalid", () => {
    const missingValidate = {
      id: nextTemplateId("missing-validate"),
      createWorld: (pkg: GamePackage, seed: number) => createBaseWorld(pkg, seed),
      step: stepTowerDefense
    } as unknown as RuntimeTemplate;

    expect(() => registerTemplate(missingValidate)).toThrow("missing required hook: validate");

    const invalidStep = {
      id: nextTemplateId("invalid-step"),
      validate: () => ({ valid: true, issues: [] }),
      createWorld: (pkg: GamePackage, seed: number) => createBaseWorld(pkg, seed),
      step: 1
    } as unknown as RuntimeTemplate;

    expect(() => registerTemplate(invalidStep)).toThrow("hook must be a function: step");

    const blankId = {
      id: "   ",
      validate: () => ({ valid: true, issues: [] }),
      createWorld: (pkg: GamePackage, seed: number) => createBaseWorld(pkg, seed),
      step: stepTowerDefense
    } as unknown as RuntimeTemplate;

    expect(() => registerTemplate(blankId)).toThrow("template id must be a non-empty string");
  });

  it("rejects duplicate templateId registrations deterministically", () => {
    const templateId = nextTemplateId("duplicate");
    const template = createSdkTemplate(templateId);

    registerTemplate(template);

    expect(() => registerTemplate(template)).toThrow(`template already registered: ${templateId}`);
  });

  it("keeps loadPackage/runScenario/runBatch compatible for registered SDK templates", () => {
    const templateId = nextTemplateId("entrypoints");
    registerTemplate(createSdkTemplate(templateId));

    const pkg = clonePackageWithTemplate(templateId);
    const baseline = structuredClone(easyPackage as GamePackage);
    const seeds = createBatchSeeds(3);

    const world = loadPackage(pkg, 11);
    const scenario = runScenario(pkg, 11);
    const batch = runBatch(pkg, seeds);

    expect(world.templateId).toBe(templateId);
    expect(world.seed).toBe(11);
    expect(world.pkg.templateId).toBe(templateId);

    expect(scenario).toEqual(runScenario(baseline, 11));
    expect(batch).toEqual(runBatch(baseline, seeds));
  });

  it("reports unknown-template diagnostics and throws for runtime entrypoints", () => {
    const templateId = nextTemplateId("unknown");
    const pkg = clonePackageWithTemplate(templateId);

    expect(validateRuntimePackage(pkg)).toEqual({
      valid: false,
      issues: [{ path: "/templateId", message: `unknown template: ${templateId}` }]
    });

    expect(() => loadPackage(pkg, 1)).toThrow(`unknown template: ${templateId}`);
    expect(() => runScenario(pkg, 1)).toThrow(`unknown template: ${templateId}`);
    expect(() => runBatch(pkg, [1])).toThrow(`unknown template: ${templateId}`);
  });
});
