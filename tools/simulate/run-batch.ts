import fs from "node:fs";
import { pathToFileURL } from "node:url";

import { createBatchSeeds, loadPackage, runBatch } from "@runtime/core/engine";
import type { GamePackage } from "@runtime/core/types";

import { formatBatchResult } from "./report";

type BatchCliArgs = {
  file: string;
  rounds: number;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

export function parseBatchCliArgs(argv: string[]): BatchCliArgs {
  const file = argv[2];
  const roundsRaw = argv[3];

  if (!file) {
    throw new Error("missing required <package> argument. usage: pnpm simulate:batch <package> <rounds>");
  }
  if (!roundsRaw) {
    throw new Error("missing required <rounds> argument. usage: pnpm simulate:batch <package> <rounds>");
  }

  const rounds = Number(roundsRaw);
  if (!Number.isInteger(rounds) || rounds <= 0) {
    throw new Error(`invalid rounds: "${roundsRaw}". rounds must be a positive integer`);
  }

  return { file, rounds };
}

function parsePackageJson(raw: string, file: string): GamePackage {
  try {
    return JSON.parse(raw) as GamePackage;
  } catch (error) {
    const message = toErrorMessage(error);
    throw new Error(`package file is not valid JSON: ${file} (${message})`);
  }
}

function readPackageFile(file: string): GamePackage {
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf-8");
  } catch (error) {
    const message = toErrorMessage(error);
    throw new Error(`failed to read package file: ${file} (${message})`);
  }
  return parsePackageJson(raw, file);
}

export function runBatchCli(argv: string[]): string {
  const args = parseBatchCliArgs(argv);
  const pkg = readPackageFile(args.file);
  loadPackage(pkg, 1);

  const seeds = createBatchSeeds(args.rounds);
  const result = runBatch(pkg, seeds);
  return formatBatchResult(result);
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
    const output = runBatchCli(process.argv);
    console.log(output);
  } catch (error) {
    console.error(`simulate:batch failed: ${toErrorMessage(error)}`);
    process.exitCode = 1;
  }
}
