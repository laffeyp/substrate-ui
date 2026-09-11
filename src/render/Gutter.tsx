// Gutter.tsx — the drag handle between two split children.
// Listeners attach synchronously in pointerdown so no pointermove between
// pointerdown and the reducer's re-render is lost. draftRatio in a ref lets
// the drag accumulate outside React's batched-state pipeline.

import { useEffect, useRef } from "react";
import { Axis } from "@/state/SplitTree";

interface Props {
  splitId: string;
  axis: Axis;
  ratio: number;
  onDragStart: (splitId: string) => void;
  onDragStop: (splitId: string, finalRatio: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const HANDLE_PX = 4;

export function Gutter({ splitId, axis, ratio, onDragStart, onDragStop, containerRef }: Props): JSX.Element {
  const draftRatio = useRef(ratio);
  useEffect(() => { draftRatio.current = ratio; }, [ratio]);

  const beginDrag = (): void => {
    onDragStart(splitId);
    const move = (e: PointerEvent): void => {
      const box = containerRef.current?.getBoundingClientRect();
      if (!box) return;
      const r = axis === Axis.ROW
        ? (e.clientX - box.left) / Math.max(1, box.width)
        : (e.clientY - box.top) / Math.max(1, box.height);
      const clamped = Math.max(0.1, Math.min(0.9, r));
      draftRatio.current = clamped;
    };
    const up = (): void => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onDragStop(splitId, draftRatio.current);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  const base = {
    position: "absolute" as const,
    background: "#2a2d33",
    zIndex: 20,
    cursor: axis === Axis.ROW ? "col-resize" : "row-resize",
  };
  const box = axis === Axis.ROW
    ? { ...base, top: 0, bottom: 0, width: HANDLE_PX, left: `calc(${ratio * 100}% - ${HANDLE_PX / 2}px)` }
    : { ...base, left: 0, right: 0, height: HANDLE_PX, top: `calc(${ratio * 100}% - ${HANDLE_PX / 2}px)` };

  return (
    <div
      data-testid={`gutter-${splitId}`}
      data-axis={axis}
      style={box}
      onPointerDown={(e) => { e.preventDefault(); beginDrag(); }}
    />
  );
}
