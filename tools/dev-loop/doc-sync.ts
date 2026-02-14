import fs from "node:fs";
import path from "node:path";

import type { DocSyncSummary } from "./types";
import { captureCommand } from "./shell";

const CONTRACT_PREFIXES = ["runtime/core/", "game/schemas/", "ai/"];
const DOC_PREFIXES = ["docs/ai/adr/", "docs/ai/tasks/"];
const DOC_SINGLE_FILES = ["README.md"];

function parsePorcelainLine(line: string): string {
  const payload = line.slice(3).trim();
  if (payload.includes(" -> ")) {
    return payload.split(" -> ")[1];
  }
  return payload;
}

export function listChangedFiles(cwd: string): string[] {
  const output = captureCommand("git status --porcelain", cwd);
  if (!output) {
    return [];
  }
  return output
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map(parsePorcelainLine)
    .filter(Boolean);
}

function collectTsFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(next));
    } else if (entry.isFile() && next.endsWith(".ts")) {
      files.push(next);
    }
  }

  return files;
}

function findBoundaryViolations(cwd: string): string[] {
  const runtimeDir = path.resolve(cwd, "runtime");
  const files = collectTsFiles(runtimeDir);
  const violations: string[] = [];

  for (const file of files) {
    const relative = path.relative(cwd, file);
    if (!relative.startsWith("runtime/core/") && !relative.startsWith("runtime/templates/")) {
      continue;
    }

    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const importMatch = /from\s+["']([^"']+)["']/.exec(line);
      if (!importMatch) {
        return;
      }
      const spec = importMatch[1];
      if (
        spec.includes("@editor") ||
        spec.includes("/editor/") ||
        spec.includes("@runtime/render") ||
        spec.includes("../render")
      ) {
        violations.push(`${relative}:${index + 1} -> ${spec}`);
      }
    });
  }

  return violations;
}

export function evaluateDocSync(changedFiles: string[], cwd: string): DocSyncSummary {
  const contractFiles = changedFiles.filter((file) => CONTRACT_PREFIXES.some((prefix) => file.startsWith(prefix)));

  const docFiles = changedFiles.filter(
    (file) => DOC_PREFIXES.some((prefix) => file.startsWith(prefix)) || DOC_SINGLE_FILES.includes(file)
  );

  const required = contractFiles.length > 0;
  const missingDocs = required && docFiles.length === 0 ? [...contractFiles] : [];
  const boundaryViolations = findBoundaryViolations(cwd);

  return {
    required,
    passed: missingDocs.length === 0 && boundaryViolations.length === 0,
    changedFiles,
    contractFiles,
    docFiles,
    missingDocs,
    boundaryViolations
  };
}

export function runDocSyncCheck(cwd: string): DocSyncSummary {
  const changedFiles = listChangedFiles(cwd);
  return evaluateDocSync(changedFiles, cwd);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cwd = process.cwd();
  const summary = runDocSyncCheck(cwd);

  if (!summary.passed) {
    if (summary.missingDocs.length > 0) {
      console.error("docs-sync-check: contract files changed without docs update:");
      for (const file of summary.missingDocs) {
        console.error(`- ${file}`);
      }
      console.error("Required docs path: docs/ai/adr/* or docs/ai/tasks/* or README.md");
    }
    if (summary.boundaryViolations.length > 0) {
      console.error("docs-sync-check: runtime boundary violations detected:");
      for (const violation of summary.boundaryViolations) {
        console.error(`- ${violation}`);
      }
    }
    process.exit(1);
  }

  console.log("docs-sync-check: pass");
}
