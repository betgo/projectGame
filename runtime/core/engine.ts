import { towerDefenseTemplate } from "../templates/tower-defense";
import type { BatchResult, GamePackage, MatchResult, RuntimeTemplate, RuntimeWorld, TickResult } from "./types";

const templates = new Map<string, RuntimeTemplate>();

templates.set(towerDefenseTemplate.id, towerDefenseTemplate);

export function registerTemplate(template: RuntimeTemplate): void {
  templates.set(template.id, template);
}

function getTemplate(templateId: string): RuntimeTemplate {
  const template = templates.get(templateId);
  if (!template) {
    throw new Error(`unknown template: ${templateId}`);
  }
  return template;
}

export function loadPackage(pkg: GamePackage, seed = 1): RuntimeWorld {
  const template = getTemplate(pkg.templateId);
  const report = template.validate(pkg);
  if (!report.valid) {
    const first = report.issues[0]?.message ?? "unknown validation error";
    throw new Error(`invalid game package: ${first}`);
  }
  return template.createWorld(pkg, seed);
}

export function step(world: RuntimeWorld, deltaMs: number): TickResult {
  const template = getTemplate(world.templateId);
  return template.step(world, deltaMs);
}

export function runScenario(pkg: GamePackage, seed: number): MatchResult {
  const world = loadPackage(pkg, seed);
  const tickMs = pkg.rules.payload.spawnRules.tickMs;
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

export function runBatch(pkg: GamePackage, seeds: number[]): BatchResult {
  const outcomes = seeds.map((seed) => runScenario(pkg, seed));
  const wins = outcomes.filter((item) => item.winner === "defender").length;
  const avgDuration = outcomes.reduce((sum, item) => sum + item.durationMs, 0) / Math.max(outcomes.length, 1);
  const totalLeaks = outcomes.reduce((sum, item) => sum + item.metrics.leaks, 0);
  const leakRate = totalLeaks / Math.max(outcomes.length, 1);
  const winRate = wins / Math.max(outcomes.length, 1);

  return {
    seeds,
    winRate,
    avgDuration,
    leakRate,
    imbalanceIndex: Math.abs(0.5 - winRate) + leakRate * 0.02,
    errors: []
  };
}
