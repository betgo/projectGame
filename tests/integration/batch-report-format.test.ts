import { describe, expect, it } from "vitest";

import { formatBatchResult } from "../../tools/simulate/report";
import type { BatchResult } from "@runtime/core/types";

describe("batch report formatter", () => {
  it("prints stable parseable metrics fields", () => {
    const result: BatchResult = {
      seeds: [1, 2, 3],
      sampleSize: 3,
      winRate: 2 / 3,
      avgDuration: 9300,
      leakRate: 1.25,
      imbalanceIndex: 0.1916666667,
      errors: []
    };

    expect(formatBatchResult(result)).toBe(
      "sampleSize=3 winRate=0.6667 avgDuration=9300 leakRate=1.2500 imbalanceIndex=0.1917"
    );
  });
});
