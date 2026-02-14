import fs from "node:fs";
import path from "node:path";

const REQUIRED_WARM_FILES = [
  "docs/ai/constitution.md",
  "docs/ai/weekly-summary.md"
];

export function verifyWarmStartFiles(cwd: string): string[] {
  const missing: string[] = [];
  for (const file of REQUIRED_WARM_FILES) {
    const absolute = path.resolve(cwd, file);
    if (!fs.existsSync(absolute)) {
      missing.push(file);
    }
  }
  return missing;
}

export function verifyPromptRefs(cwd: string, promptRefs: string[]): string[] {
  const missing: string[] = [];
  for (const ref of promptRefs) {
    const file = path.resolve(cwd, `docs/ai/prompts/${ref}.md`);
    if (!fs.existsSync(file)) {
      missing.push(ref);
    }
  }
  return missing;
}
