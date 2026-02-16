import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { BatchResult } from "@runtime/core/types";
import { formatBatchResult } from "../../tools/simulate/report";

const projectRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const readmePath = path.join(projectRoot, "README.md");

function readBacktickedValue(prefix: string, content: string): string {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escaped}:\\s*\\\`([^\\\`]+)\\\``);
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`missing documentation line: ${prefix}`);
  }
  return match[1];
}

describe("batch simulation docs contract", () => {
  it("documents command shape and output field order used by formatter", () => {
    const readme = fs.readFileSync(readmePath, "utf-8");
    const documentedCommand = readBacktickedValue("Command shape", readme);
    const documentedBaselineCommand = readBacktickedValue("Performance baseline command (reproducible)", readme);
    const documentedThreshold = readBacktickedValue("Performance threshold", readme);
    const documentedOutput = readBacktickedValue("Output fields (single line, parseable)", readme);
    const sample: BatchResult = {
      seeds: [1, 2, 3],
      sampleSize: 3,
      winRate: 2 / 3,
      avgDuration: 9300,
      leakRate: 1.25,
      imbalanceIndex: 0.1916666667,
      errors: []
    };
    const formatterOutput = formatBatchResult(sample);

    expect(documentedCommand).toBe("pnpm simulate:batch <package> <rounds>");
    expect(documentedBaselineCommand).toBe("pnpm simulate:batch game/examples/td-normal.json 100 --max-imbalance=0.6000");
    expect(documentedThreshold).toContain("imbalanceIndex <= 0.6000");
    expect(documentedOutput).toBe(
      "sampleSize=<int> winRate=<ratio> avgDuration=<ms> leakRate=<ratio> imbalanceIndex=<score>"
    );
    expect(documentedOutput.split(" ").map((item) => item.split("=")[0])).toEqual(
      formatterOutput.split(" ").map((item) => item.split("=")[0])
    );
  });
});
