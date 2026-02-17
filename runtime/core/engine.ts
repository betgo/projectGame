import { towerDefenseTemplate } from "../templates/tower-defense";
import { rpgTopdownTemplate } from "../templates/rpg-topdown";
import { normalizeGamePackageSchemaVersion } from "@game/schemas/index";
import type {
  BatchResult,
  GamePackage,
  MatchResult,
  RuntimeTemplate,
  RuntimeTemplateHookName,
  RuntimeWorld,
  TickResult,
  ValidationIssue,
  ValidationReport
} from "./types";

const templates = new Map<string, RuntimeTemplate>();
const REQUIRED_TEMPLATE_HOOKS: RuntimeTemplateHookName[] = ["validate", "createWorld", "step"];

function invalidTemplateContract(message: string): Error {
  return new Error(`invalid runtime template: ${message}`);
}

function parseTemplateId(value: unknown): string {
  if (typeof value !== "string") {
    throw invalidTemplateContract("template id must be a string");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw invalidTemplateContract("template id must be a non-empty string");
  }

  if (normalized !== value) {
    throw invalidTemplateContract("template id must not include surrounding whitespace");
  }

  return normalized;
}

function assertTemplateContract(template: RuntimeTemplate): string {
  if (typeof template !== "object" || template === null) {
    throw invalidTemplateContract("template must be an object");
  }

  const candidate = template as Record<string, unknown>;
  const id = parseTemplateId(candidate.id);

  for (const hook of REQUIRED_TEMPLATE_HOOKS) {
    if (!(hook in candidate)) {
      throw invalidTemplateContract(`missing required hook: ${hook} (templateId=${id})`);
    }
    if (typeof candidate[hook] !== "function") {
      throw invalidTemplateContract(`hook must be a function: ${hook} (templateId=${id})`);
    }
  }

  return id;
}

function toUnknownTemplateIssue(templateId: string): ValidationIssue {
  return {
    path: "/templateId",
    message: `unknown template: ${templateId}`
  };
}

registerTemplate(towerDefenseTemplate);
registerTemplate(rpgTopdownTemplate);

export function registerTemplate(template: RuntimeTemplate): void {
  const id = assertTemplateContract(template);
  if (templates.has(id)) {
    throw new Error(`template already registered: ${id}`);
  }
  templates.set(id, template);
}

function getTemplate(templateId: string): RuntimeTemplate {
  const template = templates.get(templateId);
  if (!template) {
    throw new Error(`unknown template: ${templateId}`);
  }
  return template;
}

export function validateRuntimePackage(pkg: GamePackage): ValidationReport {
  const normalized = normalizeGamePackageSchemaVersion(pkg);
  if (!normalized.ok) {
    return {
      valid: false,
      issues: normalized.issues
    };
  }

  const normalizedPackage = normalized.value;
  const template = templates.get(normalizedPackage.templateId);
  if (!template) {
    return {
      valid: false,
      issues: [toUnknownTemplateIssue(normalizedPackage.templateId)]
    };
  }

  return template.validate(normalizedPackage);
}

export function loadPackage(pkg: GamePackage, seed = 1): RuntimeWorld {
  const normalized = normalizeGamePackageSchemaVersion(pkg);
  if (!normalized.ok) {
    const first = normalized.issues[0]?.message ?? "unknown schema version error";
    throw new Error(`invalid game package: ${first}`);
  }

  const normalizedPackage = normalized.value;
  const template = getTemplate(normalizedPackage.templateId);
  const report = template.validate(normalizedPackage);
  if (!report.valid) {
    const first = report.issues[0]?.message ?? "unknown validation error";
    throw new Error(`invalid game package: ${first}`);
  }
  return template.createWorld(normalizedPackage, seed);
}

export function step(world: RuntimeWorld, deltaMs: number): TickResult {
  const template = getTemplate(world.templateId);
  return template.step(world, deltaMs);
}

export function runScenario(pkg: GamePackage, seed: number): MatchResult {
  if (!Number.isInteger(seed) || seed <= 0) {
    throw new Error(`invalid seed: ${seed}. seed must be a positive integer`);
  }

  const world = loadPackage(pkg, seed);
  const tickMs = resolveRuntimeTickMs(world.pkg);
  const maxTicks = Math.max(1, Math.floor((30 * 60 * 1000) / tickMs));

  for (let i = 0; i < maxTicks; i += 1) {
    const result = step(world, tickMs);
    if (result.status !== "running") {
      return {
        winner: result.status === "won" ? "defender" : "enemy",
        durationTicks: result.tick,
        durationMs: result.elapsedMs,
        seed,
        metrics: { ...result.metrics }
      };
    }
  }

  return {
    winner: "enemy",
    durationTicks: maxTicks,
    durationMs: maxTicks * tickMs,
    seed,
    metrics: { ...world.metrics }
  };
}

function resolveRuntimeTickMs(pkg: GamePackage): number {
  const payload = pkg.rules?.payload as Record<string, unknown> | undefined;
  const spawnRules = payload?.spawnRules as Record<string, unknown> | undefined;
  const spawnTickMs = spawnRules?.tickMs;
  if (typeof spawnTickMs === "number" && Number.isFinite(spawnTickMs) && spawnTickMs > 0) {
    return Math.floor(spawnTickMs);
  }

  const rpgRules = payload?.rules as Record<string, unknown> | undefined;
  const tickConfig = rpgRules?.tick as Record<string, unknown> | undefined;
  const rpgTickMs = tickConfig?.tickMs;
  if (typeof rpgTickMs === "number" && Number.isFinite(rpgTickMs) && rpgTickMs > 0) {
    return Math.floor(rpgTickMs);
  }

  throw new Error("invalid game package: missing runtime tick configuration");
}

export function createBatchSeeds(rounds: number, startSeed = 1): number[] {
  if (!Number.isInteger(rounds) || rounds <= 0) {
    throw new Error(`invalid rounds: ${rounds}. rounds must be a positive integer`);
  }
  if (!Number.isInteger(startSeed) || startSeed <= 0) {
    throw new Error(`invalid start seed: ${startSeed}. start seed must be a positive integer`);
  }
  return Array.from({ length: rounds }, (_, index) => startSeed + index);
}

function assertValidSeed(seed: number, index: number): void {
  if (!Number.isInteger(seed) || seed <= 0) {
    throw new Error(`invalid seed at index ${index}: ${seed}. seed must be a positive integer`);
  }
}

export function runBatch(pkg: GamePackage, seeds: number[]): BatchResult {
  if (seeds.length === 0) {
    throw new Error("batch seeds must not be empty");
  }

  const normalizedSeeds = [...seeds];
  normalizedSeeds.forEach(assertValidSeed);

  const outcomes = normalizedSeeds.map((seed) => runScenario(pkg, seed));
  const sampleSize = outcomes.length;
  const wins = outcomes.filter((item) => item.winner === "defender").length;
  const avgDuration = outcomes.reduce((sum, item) => sum + item.durationMs, 0) / sampleSize;
  const totalLeaks = outcomes.reduce((sum, item) => sum + item.metrics.leaks, 0);
  const leakRate = totalLeaks / sampleSize;
  const winRate = wins / sampleSize;

  return {
    seeds: normalizedSeeds,
    sampleSize,
    winRate,
    avgDuration,
    leakRate,
    imbalanceIndex: Math.abs(0.5 - winRate) + leakRate * 0.02,
    errors: []
  };
}
