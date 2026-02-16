import type { Dispatch, KeyboardEvent, PointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { GameProject } from "@runtime/core/types";

import type { EditorOperation } from "../operations";

type Props = {
  project: GameProject;
  dispatch: Dispatch<EditorOperation>;
};

type CellPosition = {
  x: number;
  y: number;
};

type BrushTool = GameProject["editorState"]["selectedTool"];

function keyForCell(x: number, y: number): string {
  return `${x}-${y}`;
}

function classNameForCell(value: number): string {
  if (value === 1) {
    return "cell path";
  }
  if (value === 2) {
    return "cell tower";
  }
  return "cell";
}

function labelForCellValue(value: number): string {
  if (value === 1) {
    return "path";
  }
  if (value === 2) {
    return "tower";
  }
  return "empty";
}

export function resolvePointerBrushTool(button: number, selectedTool: BrushTool): BrushTool | null {
  if (button === 0) {
    return selectedTool;
  }
  if (button === 2) {
    return "empty";
  }
  return null;
}

export function isBrushPointerActive(buttons: number): boolean {
  return (buttons & 1) === 1 || (buttons & 2) === 2;
}

export function MapCanvas({ project, dispatch }: Props) {
  const { map } = project;
  const [targetCell, setTargetCell] = useState<CellPosition | null>(null);
  const [activeStrokeTool, setActiveStrokeTool] = useState<BrushTool | null>(null);
  const activeStrokeToolRef = useRef<BrushTool | null>(null);
  const paintedInStroke = useRef<Set<string>>(new Set());

  const stopStroke = useCallback(() => {
    paintedInStroke.current.clear();
    activeStrokeToolRef.current = null;
    setActiveStrokeTool(null);
  }, []);

  useEffect(() => {
    if (!activeStrokeTool) {
      return;
    }

    const onStop = () => {
      stopStroke();
    };

    window.addEventListener("pointerup", onStop);
    window.addEventListener("pointercancel", onStop);
    return () => {
      window.removeEventListener("pointerup", onStop);
      window.removeEventListener("pointercancel", onStop);
    };
  }, [activeStrokeTool, stopStroke]);

  const paintCell = useCallback(
    (x: number, y: number, tool: BrushTool, dedupeInStroke: boolean) => {
      const cellKey = keyForCell(x, y);
      if (dedupeInStroke && paintedInStroke.current.has(cellKey)) {
        return;
      }

      if (dedupeInStroke) {
        paintedInStroke.current.add(cellKey);
      }

      dispatch({ type: "paint-cell", x, y, tool });
      setTargetCell({ x, y });
    },
    [dispatch]
  );

  const onCellPointerDown = (event: PointerEvent<HTMLButtonElement>, cell: CellPosition) => {
    const strokeTool = resolvePointerBrushTool(event.button, project.editorState.selectedTool);
    if (!strokeTool) {
      return;
    }

    event.preventDefault();
    paintedInStroke.current.clear();
    activeStrokeToolRef.current = strokeTool;
    setActiveStrokeTool(strokeTool);
    paintCell(cell.x, cell.y, strokeTool, true);
  };

  const onCellPointerEnter = (event: PointerEvent<HTMLButtonElement>, cell: CellPosition) => {
    setTargetCell(cell);

    const strokeTool = activeStrokeToolRef.current;
    if (!strokeTool) {
      return;
    }
    if (!isBrushPointerActive(event.buttons)) {
      stopStroke();
      return;
    }

    paintCell(cell.x, cell.y, strokeTool, true);
  };

  const onCellKeyDown = (event: KeyboardEvent<HTMLButtonElement>, cell: CellPosition) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    paintCell(cell.x, cell.y, project.editorState.selectedTool, false);
  };

  const brushLabel = useMemo(
    () => activeStrokeTool ?? project.editorState.selectedTool,
    [activeStrokeTool, project.editorState.selectedTool]
  );

  return (
    <div className="panel">
      <h3>Map Editor</h3>
      <div className="small">Brush: {brushLabel}</div>
      <div className="small">Left-drag paints selected tool. Right-drag erases to empty.</div>
      <div className="small">
        Target: {targetCell ? `(${targetCell.x}, ${targetCell.y})` : "none"}
      </div>
      <div
        className="grid map-grid"
        style={{ gridTemplateColumns: `repeat(${map.width}, 24px)` }}
        onContextMenu={(event) => event.preventDefault()}
        onPointerUp={stopStroke}
        onPointerLeave={() => {
          if (!activeStrokeToolRef.current) {
            setTargetCell(null);
          }
        }}
      >
        {map.cells.map((row, y) =>
          row.map((value, x) => (
            <button
              key={`${x}-${y}`}
              className={`${classNameForCell(value)}${
                targetCell?.x === x && targetCell?.y === y ? " active" : ""
              }`}
              onPointerDown={(event) => onCellPointerDown(event, { x, y })}
              onPointerEnter={(event) => onCellPointerEnter(event, { x, y })}
              onFocus={() => setTargetCell({ x, y })}
              onKeyDown={(event) => onCellKeyDown(event, { x, y })}
              onBlur={() => {
                if (!activeStrokeToolRef.current) {
                  setTargetCell(null);
                }
              }}
              title={`(${x}, ${y})`}
              aria-label={`Cell (${x}, ${y}) ${labelForCellValue(value)}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
