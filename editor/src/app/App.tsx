import { MapCanvas } from "@editor/editor/components/MapCanvas";
import { Inspector } from "@editor/editor/components/Inspector";
import { PreviewControls } from "@editor/editor/components/PreviewControls";
import { WavePanel } from "@editor/editor/components/WavePanel";
import { useEditorStore } from "@editor/editor/store";

export function App() {
  const { project, dispatch } = useEditorStore();

  return (
    <div className="layout">
      <MapCanvas project={project} dispatch={dispatch} />
      <div>
        <Inspector project={project} dispatch={dispatch} />
        <WavePanel project={project} />
        <PreviewControls project={project} />
      </div>
    </div>
  );
}
