import { describe, expect, it } from "vitest";

import { createProject, exportPackage, startPreview } from "@editor/editor/api";
import { runScenario } from "@runtime/core/engine";

describe("preview consistency", () => {
  it("preview and headless share same winner under same seed", () => {
    const project = createProject("tower-defense");
    const session = startPreview(project, 11);
    const previewResult = session.runToEnd();

    const pkg = exportPackage(project);
    const headlessResult = runScenario(pkg, 11);

    expect(previewResult.winner).toBe(headlessResult.winner);
    expect(previewResult.metrics.leaks).toBe(headlessResult.metrics.leaks);
  });
});
