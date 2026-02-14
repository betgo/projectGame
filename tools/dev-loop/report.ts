import fs from "node:fs";
import path from "node:path";

import type { LoopResult } from "./types";

export function writeRunReport(cwd: string, result: LoopResult): string {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const dir = path.resolve(cwd, `docs/ai/run-logs/${day}`);
  fs.mkdirSync(dir, { recursive: true });

  const file = path.resolve(dir, `${stamp}.json`);
  fs.writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`);

  return file;
}
