import { useMemo, useReducer } from "react";

import type { GameProject } from "@runtime/core/types";

import { applyOperation, type EditorOperation } from "./operations";
import { createProjectByTemplate, type SupportedTemplateId } from "./template-switch";

export function createDefaultProject(templateId: SupportedTemplateId = "tower-defense"): GameProject {
  return createProjectByTemplate(templateId);
}

function reducer(state: GameProject, op: EditorOperation): GameProject {
  const result = applyOperation(state, op);
  return result.ok ? result.project : state;
}

export function useEditorStore(initial?: GameProject) {
  const [project, dispatch] = useReducer(reducer, initial ?? createDefaultProject());
  return useMemo(
    () => ({
      project,
      dispatch
    }),
    [project]
  );
}
