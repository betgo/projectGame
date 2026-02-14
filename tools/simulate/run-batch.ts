import fs from "node:fs";

import { runBatch } from "@runtime/core/engine";
import type { GamePackage } from "@runtime/core/types";

import { formatBatchResult } from "./report";

const file = process.argv[2] ?? "game/examples/td-easy.json";
const rounds = Number(process.argv[3] ?? "100");

const seeds = Array.from({ length: rounds }, (_, index) => index + 1);
const raw = fs.readFileSync(file, "utf-8");
const pkg = JSON.parse(raw) as GamePackage;
const result = runBatch(pkg, seeds);

console.log(formatBatchResult(result));
