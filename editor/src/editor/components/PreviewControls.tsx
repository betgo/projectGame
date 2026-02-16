import { useEffect, useMemo, useRef, useState } from "react";

import { getWorldSnapshot } from "@runtime/render/snapshot";
import { ThreeRenderAdapter } from "@runtime/render/three-adapter";

import { startPreview } from "../api";
import type { GameProject } from "@runtime/core/types";

type Props = {
  project: GameProject;
};

export function PreviewControls({ project }: Props) {
  const [lastResult, setLastResult] = useState<string>("idle");
  const [seed, setSeed] = useState<number>(42);
  const session = useMemo(() => startPreview(project, seed), [project, seed]);
  const renderHostRef = useRef<HTMLDivElement | null>(null);
  const adapterRef = useRef<ThreeRenderAdapter | null>(null);

  useEffect(() => {
    const host = renderHostRef.current;
    if (!host) {
      return;
    }

    const adapter = new ThreeRenderAdapter(host);
    adapterRef.current = adapter;
    adapter.applySnapshot(getWorldSnapshot(session.world));

    return () => {
      adapter.dispose();
      if (adapterRef.current === adapter) {
        adapterRef.current = null;
      }
    };
  }, [session]);

  const renderSnapshot = () => {
    if (!adapterRef.current) {
      return;
    }
    adapterRef.current.applySnapshot(getWorldSnapshot(session.world));
  };

  const runStep = () => {
    const stepResult = session.playStep();
    renderSnapshot();
    setLastResult(`tick ${stepResult.tick}, status ${stepResult.status}, leaks ${stepResult.metrics.leaks}`);
  };

  const runFast = () => {
    const loops = Math.max(1, Math.floor(project.editorState.speed * 10));
    let final = session.playStep();
    for (let i = 1; i < loops; i += 1) {
      final = session.playStep();
      if (final.status !== "running") {
        break;
      }
    }
    renderSnapshot();
    setLastResult(`tick ${final.tick}, status ${final.status}, leaks ${final.metrics.leaks}`);
  };

  const runFull = () => {
    const result = session.runToEnd();
    setLastResult(`winner ${result.winner}, duration ${result.durationTicks} ticks`);
  };

  const reset = () => {
    setSeed((value) => value + 1);
    setLastResult("session reset");
  };

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
      <div className="small">Seed: {seed}</div>
      <div className="small">{lastResult}</div>
    </div>
  );
}
