import { describe, expect, it } from "vitest";

import { createProject, startPreviewDebugSession } from "@editor/editor/api";

describe("preview debug overlay session", () => {
  it("tracks diagnostics for step/fast/full preview actions", () => {
    const project = createProject("tower-defense");
    const session = startPreviewDebugSession(project, 9);

    const initial = session.getState();
    expect(initial.error).toBeNull();
    expect(initial.diagnostics.tick).toBe(0);
    expect(initial.diagnostics.elapsedMs).toBe(0);
    expect(initial.diagnostics.seed).toBe(9);
    expect(initial.diagnostics.status).toBe("running");

    const stepResult = session.playStep();
    expect(stepResult).not.toBeNull();

    const stepState = session.getState();
    expect(stepState.error).toBeNull();
    expect(stepState.action).toBe("step");
    expect(stepState.diagnostics.tick).toBe(1);
    expect(stepState.diagnostics.elapsedMs).toBe(stepState.diagnostics.tickMs);

    const fastResult = session.playFast(3);
    expect(fastResult).not.toBeNull();

    const fastState = session.getState();
    expect(fastState.error).toBeNull();
    expect(fastState.action).toBe("fast");
    expect(fastState.diagnostics.tick).toBeGreaterThan(stepState.diagnostics.tick);

    const fullResult = session.runToEnd();
    expect(fullResult).not.toBeNull();

    const fullState = session.getState();
    expect(fullState.error).toBeNull();
    expect(fullState.action).toBe("full");
    expect(fullState.diagnostics.status).not.toBe("running");
    expect(fullState.diagnostics.tick).toBe(fullResult?.durationTicks);
    expect(fullState.diagnostics.seed).toBe(9);
  });

  it("surfaces validation diagnostics without crashing preview actions", () => {
    const invalidProject = createProject("tower-defense");
    invalidProject.templatePayload.path = [];

    const session = startPreviewDebugSession(invalidProject, 5);
    const initial = session.getState();

    expect(initial.error?.phase).toBe("validation");
    expect(initial.error?.summary).toContain("preview validation failed");
    expect(initial.error?.hints.some((hint) => hint.includes("path"))).toBe(true);
    expect(initial.diagnostics.status).toBe("error");

    expect(session.playStep()).toBeNull();
    expect(session.playFast(4)).toBeNull();
    expect(session.runToEnd()).toBeNull();

    const afterActions = session.getState();
    expect(afterActions.action).toBe("full");
    expect(afterActions.error?.phase).toBe("validation");
    expect(afterActions.diagnostics.tick).toBe(0);
    expect(afterActions.diagnostics.elapsedMs).toBe(0);
  });

  it("captures runtime failures as overlay diagnostics with actionable hint", () => {
    const project = createProject("tower-defense");
    const session = startPreviewDebugSession(project, 7);

    expect(session.world).not.toBeNull();
    if (!session.world) {
      throw new Error("expected runtime world for debug session");
    }

    session.world.pkg.entities.enemies = [];
    session.world.internal.spawnQueue = [{ atMs: 0, enemyId: "ghost" }];

    const result = session.playStep();
    expect(result).toBeNull();

    const failureState = session.getState();
    expect(failureState.action).toBe("step");
    expect(failureState.error?.phase).toBe("runtime");
    expect(failureState.error?.summary).toContain("preview runtime failed");
    expect(failureState.error?.hints[0]).toContain("enemy");
    expect(failureState.diagnostics.status).toBe("error");
  });

  it("keeps reset and replay diagnostics deterministic", () => {
    const project = createProject("tower-defense");
    const firstSession = startPreviewDebugSession(project, 13);
    const firstResult = firstSession.runToEnd();
    const firstState = firstSession.getState();

    expect(firstResult).not.toBeNull();
    expect(firstState.error).toBeNull();
    expect(firstState.action).toBe("full");

    const resetSession = startPreviewDebugSession(project, 13);
    const resetInitial = resetSession.getState();
    expect(resetInitial.action).toBe("init");
    expect(resetInitial.error).toBeNull();
    expect(resetInitial.diagnostics.tick).toBe(0);
    expect(resetInitial.diagnostics.elapsedMs).toBe(0);
    expect(resetInitial.diagnostics.seed).toBe(13);

    const replayResult = resetSession.runToEnd();
    const replayState = resetSession.getState();
    expect(replayResult).toEqual(firstResult);
    expect(replayState.error).toBeNull();
    expect(replayState.action).toBe("full");
    expect(replayState.diagnostics.tick).toBe(firstState.diagnostics.tick);
    expect(replayState.diagnostics.elapsedMs).toBe(firstState.diagnostics.elapsedMs);
    expect(replayState.diagnostics.metrics).toEqual(firstState.diagnostics.metrics);
  });
});
