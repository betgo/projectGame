import type { TickResult } from "./types";
import type { RuntimeWorld, RuntimeTemplate } from "./types";

export function createFixedTickRunner(template: RuntimeTemplate, tickMs: number) {
  return {
    runUntilEnd(world: RuntimeWorld, maxTicks: number): TickResult {
      let last: TickResult = template.step(world, tickMs);
      for (let i = 1; i < maxTicks; i += 1) {
        if (last.status !== "running") {
          break;
        }
        last = template.step(world, tickMs);
      }
      return last;
    }
  };
}
