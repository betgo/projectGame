import fs from "node:fs";

import { runScenario } from "@runtime/core/engine";
import type { GamePackage } from "@runtime/core/types";

import { formatMatchResult } from "./report";

const file = process.argv[2] ?? "game/examples/td-easy.json";
const seed = Number(process.argv[3] ?? "1");

const raw = fs.readFileSync(file, "utf-8");
const pkg = JSON.parse(raw) as GamePackage;
const result = runScenario(pkg, seed);

console.log(formatMatchResult(result));
