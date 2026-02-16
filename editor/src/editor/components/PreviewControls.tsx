import { useEffect, useMemo, useRef, useState } from "react";

import { getWorldSnapshot } from "@runtime/render/snapshot";
import { ThreeRenderAdapter, type RenderSelection } from "@runtime/render/three-adapter";

import { startPreviewDebugSession, type PreviewOverlayState } from "../api";
import type { GameProject } from "@runtime/core/types";

type Props = {
  project: GameProject;
};

export function PreviewControls({ project }: Props) {
  const [lastResult, setLastResult] = useState<string>("idle");
  const [selectionLabel, setSelectionLabel] = useState<string>("none");
  const [seed, setSeed] = useState<number>(42);
  const session = useMemo(() => startPreviewDebugSession(project, seed), [project, seed]);
  const [overlayState, setOverlayState] = useState<PreviewOverlayState>(() => session.getState());
  const renderHostRef = useRef<HTMLDivElement | null>(null);
  const adapterRef = useRef<ThreeRenderAdapter | null>(null);

  useEffect(() => {
    setOverlayState(session.getState());
  }, [session]);

  useEffect(() => {
    const host = renderHostRef.current;
    if (!host) {
      return;
    }

    const adapter = new ThreeRenderAdapter(host, {
      onSelectionChange: (selection: RenderSelection | null) => {
        if (!selection) {
          setSelectionLabel("none");
          return;
        }
        setSelectionLabel(`${selection.kind}:${selection.id}`);
      }
    });
    adapterRef.current = adapter;
    if (session.world) {
      adapter.applySnapshot(getWorldSnapshot(session.world));
    }

    return () => {
      adapter.dispose();
      if (adapterRef.current === adapter) {
        adapterRef.current = null;
      }
      setSelectionLabel("none");
    };
  }, [session]);

  const renderSnapshot = () => {
    if (!adapterRef.current || !session.world) {
      return;
    }
    adapterRef.current.applySnapshot(getWorldSnapshot(session.world));
  };

  const syncOverlay = () => {
    const state = session.getState();
    setOverlayState(state);
    if (state.error) {
      setLastResult(state.error.summary);
    }
    return state;
  };

  const runStep = () => {
    const stepResult = session.playStep();
    renderSnapshot();
    const state = syncOverlay();
    if (stepResult && !state.error) {
      setLastResult(`tick ${stepResult.tick}, status ${stepResult.status}, leaks ${stepResult.metrics.leaks}`);
    }
  };

  const runFast = () => {
    const loops = Math.max(1, Math.floor(project.editorState.speed * 10));
    const final = session.playFast(loops);
    renderSnapshot();
    const state = syncOverlay();
    if (final && !state.error) {
      setLastResult(`tick ${final.tick}, status ${final.status}, leaks ${final.metrics.leaks}`);
    }
  };

  const runFull = () => {
    const result = session.runToEnd();
    renderSnapshot();
    const state = syncOverlay();
    if (result && !state.error) {
      setLastResult(`winner ${result.winner}, duration ${result.durationTicks} ticks`);
      return;
    }
    if (!result && !state.error) {
      setLastResult("preview skipped");
    }
  };

  const reset = () => {
    setSeed((value) => value + 1);
    setLastResult("session reset");
  };

  const diagnostics = overlayState.diagnostics;
  const metrics = diagnostics.metrics;

  return (
    <div className="panel">
      <h3>Preview</h3>
      <div className="row">
        <button className="secondary" onClick={reset}>
          Reset
        </button>
        <button onClick={runStep}>Step</button>
        <button onClick={runFast}>Fast</button>
        <button onClick={runFull}>Run Full</button>
      </div>
      <div className="preview-stage" ref={renderHostRef} />
      <div className="preview-debug-overlay">
        <div className="small">Debug Overlay</div>
        <div className="small">
          Tick {diagnostics.tick} | Elapsed {diagnostics.elapsedMs}ms | TickMs {diagnostics.tickMs} | Seed {diagnostics.seed}
        </div>
        <div className="small">
          Status {diagnostics.status} | Lives {diagnostics.lives} | Towers {diagnostics.activeTowers} | Enemies {diagnostics.activeEnemies} | Pending {diagnostics.pendingSpawns}
        </div>
        <div className="small">
          Metrics kills {metrics.kills} | leaks {metrics.leaks} | damage {metrics.damageDealt} | shots {metrics.shotsFired} | gold {metrics.goldEarned}
        </div>
      </div>
      {overlayState.error ? (
        <div className="preview-error">
          <div className="small">
            Error ({overlayState.error.phase}): {overlayState.error.summary}
          </div>
          {overlayState.error.issues.map((issue, index) => (
            <div className="small" key={`${issue.path}-${index}`}>
              {issue.path}: {issue.message}
            </div>
          ))}
          {overlayState.error.hints.map((hint, index) => (
            <div className="small" key={`hint-${index}`}>
              Hint: {hint}
            </div>
          ))}
        </div>
      ) : null}
      <div className="small">Controls: Left drag orbit, Shift/Right drag pan, Wheel zoom.</div>
      <div className="small">Hover: {selectionLabel}</div>
      <div className="small">Seed: {seed}</div>
      <div className="small">{lastResult}</div>
    </div>
  );
}
