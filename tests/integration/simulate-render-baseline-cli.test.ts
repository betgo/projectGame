import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

function runRenderBaselineCli(args: string[]) {
  return spawnSync("node", ["--import", "tsx", "tools/simulate/run-render-baseline.ts", ...args], {
    cwd: projectRoot,
    encoding: "utf-8"
  });
}

describe("simulate:render-baseline cli", () => {
  it("prints parseable baseline report for representative packages", () => {
    const result = runRenderBaselineCli([
      "--restarts=2",
      "--warmup-frames=3",
      "--measured-frames=16",
      "--seed=1",
      "--max-memory-delta-bytes=0"
    ]);

    expect(result.status).toBe(0);
    const lines = result.stdout
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    expect(lines).toHaveLength(5);
    expect(lines[0]).toBe("protocol restarts=2 warmupFrames=3 measuredFrames=16 seed=1");
    expect(lines[1]).toMatch(
      /^package=td-easy frames=32 fps=\d+\.\d{4} frameAvgMs=\d+\.\d{4} frameP50Ms=\d+\.\d{4} frameP90Ms=\d+\.\d{4} frameP99Ms=\d+\.\d{4} memoryFirstBytes=\d+ memoryLastBytes=\d+ memoryDeltaBytes=0 memoryMaxDriftBytes=0 reuseRatio=\d+\.\d{4} allocationsPerRestart=\d+\.\d{2}$/
    );
    expect(lines[2]).toMatch(
      /^package=td-normal frames=32 fps=\d+\.\d{4} frameAvgMs=\d+\.\d{4} frameP50Ms=\d+\.\d{4} frameP90Ms=\d+\.\d{4} frameP99Ms=\d+\.\d{4} memoryFirstBytes=\d+ memoryLastBytes=\d+ memoryDeltaBytes=0 memoryMaxDriftBytes=0 reuseRatio=\d+\.\d{4} allocationsPerRestart=\d+\.\d{2}$/
    );
    expect(lines[3]).toMatch(
      /^package=td-hard frames=32 fps=\d+\.\d{4} frameAvgMs=\d+\.\d{4} frameP50Ms=\d+\.\d{4} frameP90Ms=\d+\.\d{4} frameP99Ms=\d+\.\d{4} memoryFirstBytes=\d+ memoryLastBytes=\d+ memoryDeltaBytes=0 memoryMaxDriftBytes=0 reuseRatio=\d+\.\d{4} allocationsPerRestart=\d+\.\d{2}$/
    );
    expect(lines[4]).toMatch(
      /^aggregate packageCount=3 totalFrames=96 overallFps=\d+\.\d{4} worstP99Ms=\d+\.\d{4} maxMemoryDeltaBytes=0$/
    );
  });

  it("keeps baseline output reproducible with identical inputs", () => {
    const args = ["--restarts=2", "--warmup-frames=2", "--measured-frames=10", "--seed=1"];
    const first = runRenderBaselineCli(args);
    const second = runRenderBaselineCli(args);

    expect(first.status).toBe(0);
    expect(second.status).toBe(0);
    expect(first.stdout.trim()).toBe(second.stdout.trim());
  });

  it("fails fast when options are invalid", () => {
    const invalidRestarts = runRenderBaselineCli(["--restarts=0"]);
    expect(invalidRestarts.status).toBe(1);
    expect(invalidRestarts.stderr).toContain("--restarts must be a positive integer");

    const unknownOption = runRenderBaselineCli(["--unsupported"]);
    expect(unknownOption.status).toBe(1);
    expect(unknownOption.stderr).toContain("unknown option");
  });
});
