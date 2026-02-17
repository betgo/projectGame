import { useMemo, useState } from "react";

import { previewTemplateSwitch } from "@editor/editor/api";
import { MapCanvas } from "@editor/editor/components/MapCanvas";
import { Inspector } from "@editor/editor/components/Inspector";
import { PreviewControls } from "@editor/editor/components/PreviewControls";
import { RpgPayloadPanel } from "@editor/editor/components/RpgPayloadPanel";
import { WavePanel } from "@editor/editor/components/WavePanel";
import { resolvePayloadPanelMode } from "@editor/editor/inspector-form";
import { useEditorStore } from "@editor/editor/store";
import { getProjectTemplateId, type SupportedTemplateId } from "@editor/editor/template-switch";

type PendingTemplateSwitch = {
  targetTemplateId: SupportedTemplateId;
  warnings: ReturnType<typeof previewTemplateSwitch>["warnings"];
};

export function App() {
  const { project, dispatch } = useEditorStore();
  const [pendingTemplateSwitch, setPendingTemplateSwitch] = useState<PendingTemplateSwitch | null>(null);
  const templateId = getProjectTemplateId(project);
  const panelMode = resolvePayloadPanelMode(templateId);

  const onTemplateSwitchRequest = (nextTemplateId: SupportedTemplateId) => {
    const preview = previewTemplateSwitch(project, nextTemplateId);
    if (!preview.requiresConfirmation) {
      dispatch({ type: "switch-template", templateId: nextTemplateId, force: true });
      setPendingTemplateSwitch(null);
      return;
    }

    setPendingTemplateSwitch({
      targetTemplateId: nextTemplateId,
      warnings: preview.warnings
    });
  };

  const onTemplateSwitchConfirm = () => {
    if (!pendingTemplateSwitch) {
      return;
    }

    dispatch({
      type: "switch-template",
      templateId: pendingTemplateSwitch.targetTemplateId,
      force: true
    });
    setPendingTemplateSwitch(null);
  };

  const onTemplateSwitchCancel = () => {
    setPendingTemplateSwitch(null);
  };

  const stablePendingTemplateSwitch = useMemo(() => {
    if (!pendingTemplateSwitch) {
      return null;
    }
    if (pendingTemplateSwitch.targetTemplateId === templateId) {
      return null;
    }
    return pendingTemplateSwitch;
  }, [pendingTemplateSwitch, templateId]);

  return (
    <div className="layout">
      <MapCanvas project={project} dispatch={dispatch} />
      <div>
        <Inspector
          project={project}
          dispatch={dispatch}
          pendingTemplateSwitch={stablePendingTemplateSwitch}
          onTemplateSwitchRequest={onTemplateSwitchRequest}
          onTemplateSwitchConfirm={onTemplateSwitchConfirm}
          onTemplateSwitchCancel={onTemplateSwitchCancel}
        />
        {panelMode === "tower-defense" ? <WavePanel project={project} /> : <RpgPayloadPanel project={project} />}
        <PreviewControls project={project} />
      </div>
    </div>
  );
}
