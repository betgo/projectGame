import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const tempDirs: string[] = [];

function runBatchCli(args: string[]) {
  return spawnSync("node", ["--import", "tsx", "tools/simulate/run-batch.ts", ...args], {
    cwd: projectRoot,
    encoding: "utf-8"
  });
}

function createTempFile(name: string, content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "simulate-batch-cli-"));
  tempDirs.push(dir);
  const file = path.join(dir, name);
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("simulate:batch cli", () => {
  it("fails when package argument is missing", () => {
    const result = runBatchCli([]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("missing required <package> argument");
  });

  it("fails when rounds is not a positive integer", () => {
    const result = runBatchCli(["game/examples/td-easy.json", "0"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("rounds must be a positive integer");
  });

  it("fails fast for malformed json package content", () => {
    const malformed = createTempFile("broken.json", "{invalid json");
    const result = runBatchCli([malformed, "3"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("package file is not valid JSON");
  });

  it("fails fast for invalid package contract", () => {
    const invalidPackage = createTempFile("invalid-package.json", JSON.stringify({ templateId: "tower-defense" }));
    const result = runBatchCli([invalidPackage, "3"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("invalid game package");
  });

  it("fails when --max-imbalance option is invalid", () => {
    const result = runBatchCli(["game/examples/td-normal.json", "5", "--max-imbalance=abc"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("invalid --max-imbalance value");
  });

  it("fails when imbalance threshold is exceeded", () => {
    const result = runBatchCli(["game/examples/td-normal.json", "5", "--max-imbalance=0.57"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("imbalance threshold exceeded");
    expect(result.stderr).toContain("actual=0.5800 threshold=0.5700");
  });

  it("prints standardized batch metrics on success", () => {
    const result = runBatchCli(["game/examples/td-easy.json", "3"]);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toMatch(
      /^sampleSize=3 winRate=\d+\.\d{4} avgDuration=\d+ leakRate=\d+\.\d{4} imbalanceIndex=\d+\.\d{4}$/
    );
  });

  it("keeps baseline command output reproducible when threshold is configured", () => {
    const args = ["game/examples/td-normal.json", "5", "--max-imbalance=0.6000"];
    const first = runBatchCli(args);
    const second = runBatchCli(args);

    expect(first.status).toBe(0);
    expect(second.status).toBe(0);
    expect(first.stdout.trim()).toBe(second.stdout.trim());
    expect(first.stdout.trim()).toBe(
      "sampleSize=5 winRate=0.0000 avgDuration=5400 leakRate=4.0000 imbalanceIndex=0.5800"
    );
  });
});
