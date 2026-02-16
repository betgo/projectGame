import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  collectRenderPerformanceBaseline,
  type RenderBaselineCollectionOptions,
  type RenderBaselinePackageInput
} from "@runtime/render/performance-baseline";
import type { GamePackage } from "@runtime/core/types";

import { formatRenderBaselineReport } from "./render-baseline-report";

type RenderBaselineCliArgs = RenderBaselineCollectionOptions & {
  files: string[];
  maxMemoryDeltaBytes?: number;
};

const DEFAULT_PACKAGES = [
  "game/examples/td-easy.json",
  "game/examples/td-normal.json",
  "game/examples/td-hard.json"
];

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

function parsePositiveInt(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
  return parsed;
}

function parseNonNegativeNumber(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return parsed;
}

function readOptionValue(args: string[], index: number, option: string): { value: string; nextIndex: number } {
  const current = args[index];
  if (current.startsWith(`${option}=`)) {
    return {
      value: current.slice(option.length + 1),
      nextIndex: index
    };
  }
  const next = args[index + 1];
  if (!next) {
    throw new Error(`missing value for ${option}`);
  }
  return {
    value: next,
    nextIndex: index + 1
  };
}

export function parseRenderBaselineCliArgs(argv: string[]): RenderBaselineCliArgs {
  const args = argv.slice(2);
  const files: string[] = [];
  let restarts: number | undefined;
  let warmupFrames: number | undefined;
  let measuredFramesPerRestart: number | undefined;
  let seed: number | undefined;
  let maxMemoryDeltaBytes: number | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      files.push(arg);
      continue;
    }

    if (arg === "--restarts" || arg.startsWith("--restarts=")) {
      if (restarts !== undefined) {
        throw new Error("duplicate option: --restarts");
      }
      const { value, nextIndex } = readOptionValue(args, index, "--restarts");
      restarts = parsePositiveInt(value, "--restarts");
      index = nextIndex;
      continue;
    }

    if (arg === "--warmup-frames" || arg.startsWith("--warmup-frames=")) {
      if (warmupFrames !== undefined) {
        throw new Error("duplicate option: --warmup-frames");
      }
      const { value, nextIndex } = readOptionValue(args, index, "--warmup-frames");
      warmupFrames = parsePositiveInt(value, "--warmup-frames");
      index = nextIndex;
      continue;
    }

    if (arg === "--measured-frames" || arg.startsWith("--measured-frames=")) {
      if (measuredFramesPerRestart !== undefined) {
        throw new Error("duplicate option: --measured-frames");
      }
      const { value, nextIndex } = readOptionValue(args, index, "--measured-frames");
      measuredFramesPerRestart = parsePositiveInt(value, "--measured-frames");
      index = nextIndex;
      continue;
    }

    if (arg === "--seed" || arg.startsWith("--seed=")) {
      if (seed !== undefined) {
        throw new Error("duplicate option: --seed");
      }
      const { value, nextIndex } = readOptionValue(args, index, "--seed");
      seed = parsePositiveInt(value, "--seed");
      index = nextIndex;
      continue;
    }

    if (arg === "--max-memory-delta-bytes" || arg.startsWith("--max-memory-delta-bytes=")) {
      if (maxMemoryDeltaBytes !== undefined) {
        throw new Error("duplicate option: --max-memory-delta-bytes");
      }
      const { value, nextIndex } = readOptionValue(args, index, "--max-memory-delta-bytes");
      maxMemoryDeltaBytes = parseNonNegativeNumber(value, "--max-memory-delta-bytes");
      index = nextIndex;
      continue;
    }

    throw new Error(
      `unknown option: "${arg}". supported options: --restarts --warmup-frames --measured-frames --seed --max-memory-delta-bytes`
    );
  }

  return {
    files: files.length > 0 ? files : [...DEFAULT_PACKAGES],
    restarts,
    warmupFrames,
    measuredFramesPerRestart,
    seed,
    maxMemoryDeltaBytes
  };
}

function parsePackageJson(raw: string, file: string): GamePackage {
  try {
    return JSON.parse(raw) as GamePackage;
  } catch (error) {
    throw new Error(`package file is not valid JSON: ${file} (${toErrorMessage(error)})`);
  }
}

function readPackageFile(file: string): GamePackage {
  let raw = "";
  try {
    raw = fs.readFileSync(file, "utf-8");
  } catch (error) {
    throw new Error(`failed to read package file: ${file} (${toErrorMessage(error)})`);
  }
  return parsePackageJson(raw, file);
}

function toPackageId(file: string, fallbackIndex: number): string {
  const parsed = path.parse(file);
  const normalized = parsed.name.trim();
  return normalized.length > 0 ? normalized : `package-${fallbackIndex + 1}`;
}

function assertMemoryGuardrail(
  report: ReturnType<typeof collectRenderPerformanceBaseline>,
  threshold: number
): void {
  const violation = report.packages.find(
    (item) => Math.abs(item.memoryTrend.deltaBytes) > threshold
  );
  if (!violation) {
    return;
  }

  throw new Error(
    `memory growth guardrail exceeded: package=${violation.packageId} delta=${violation.memoryTrend.deltaBytes} threshold=${threshold}`
  );
}

export function runRenderBaselineCli(argv: string[]): string {
  const args = parseRenderBaselineCliArgs(argv);
  const packageInputs: RenderBaselinePackageInput[] = args.files.map((file, index) => ({
    id: toPackageId(file, index),
    pkg: readPackageFile(file)
  }));

  const report = collectRenderPerformanceBaseline(packageInputs, {
    restarts: args.restarts,
    warmupFrames: args.warmupFrames,
    measuredFramesPerRestart: args.measuredFramesPerRestart,
    seed: args.seed
  });

  if (args.maxMemoryDeltaBytes !== undefined) {
    assertMemoryGuardrail(report, args.maxMemoryDeltaBytes);
  }

  return formatRenderBaselineReport(
    report,
    packageInputs.map((item) => item.id)
  );
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return import.meta.url === pathToFileURL(entry).href;
}

if (isMainModule()) {
  try {
    const output = runRenderBaselineCli(process.argv);
    console.log(output);
  } catch (error) {
    console.error(`simulate:render-baseline failed: ${toErrorMessage(error)}`);
    process.exitCode = 1;
  }
}
