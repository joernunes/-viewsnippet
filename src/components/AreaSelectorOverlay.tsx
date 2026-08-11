import React, { useState, useRef, useEffect } from "react";
import { Check, X, Crop, Move } from "lucide-react";
import { Button } from "./ui/button";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AreaSelectorOverlayProps {
  isActive: boolean;
  onCancel: () => void;
  onConfirmArea: (rect: Rect, containerRect: { width: number; height: number }) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function AreaSelectorOverlay({
  isActive,
  onCancel,
  onConfirmArea,
  containerRef,
}: AreaSelectorOverlayProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<Rect | null>(null);
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onCancel]);

  useEffect(() => {
    if (!isActive) {
      setSelectionRect(null);
      setHasSelection(false);
      setIsSelecting(false);
      setStartPoint(null);
    }
  }, [isActive]);

  if (!isActive) return null;

  const getContainerCoords = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const bbox = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - bbox.left, bbox.width));
    const y = Math.max(0, Math.min(e.clientY - bbox.top, bbox.height));
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore clicks on confirm/cancel button box
    if ((e.target as HTMLElement).closest(".area-action-btn")) return;

    const coords = getContainerCoords(e);
    setStartPoint(coords);
    setIsSelecting(true);
    setHasSelection(false);
    setSelectionRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !startPoint) return;
    const coords = getContainerCoords(e);

    const x = Math.min(coords.x, startPoint.x);
    const y = Math.min(coords.y, startPoint.y);
    const width = Math.abs(coords.x - startPoint.x);
    const height = Math.abs(coords.y - startPoint.y);

    setSelectionRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    if (selectionRect && selectionRect.width > 15 && selectionRect.height > 15) {
      setHasSelection(true);
    } else {
      setHasSelection(false);
    }
  };

  const handleConfirm = () => {
    if (!selectionRect || !containerRef.current) return;
    const bbox = containerRef.current.getBoundingClientRect();
    onConfirmArea(selectionRect, { width: bbox.width, height: bbox.height });
  };

  return (
    <div
      className="absolute inset-0 z-[80] cursor-crosshair select-none overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Dimmed backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

      {/* Top Instructional Banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-zinc-900/90 border border-zinc-700/80 text-white text-xs px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 pointer-events-auto">
        <Crop size={15} className="text-cyan-400 shrink-0" />
        <span>
          Clique e arraste para selecionar a área a capturar. Prima <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono text-[10px]">ESC</kbd> para cancelar.
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0 text-zinc-400 hover:text-white rounded-lg area-action-btn ml-1"
        >
          <X size={14} />
        </Button>
      </div>

      {/* Selection Box Highlight */}
      {selectionRect && (
        <div
          className="absolute border-2 border-cyan-400 bg-cyan-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-none"
          style={{
            left: `${selectionRect.x}px`,
            top: `${selectionRect.y}px`,
            width: `${selectionRect.width}px`,
            height: `${selectionRect.height}px`,
          }}
        >
          {/* Corner Handles */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-cyan-400 border border-black rounded-full" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-cyan-400 border border-black rounded-full" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-cyan-400 border border-black rounded-full" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-cyan-400 border border-black rounded-full" />

          {/* Dimensions Badge */}
          <div className="absolute -top-7 left-0 bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 text-[10px] font-mono px-2 py-0.5 rounded shadow">
            {Math.round(selectionRect.width)} × {Math.round(selectionRect.height)} px
          </div>

          {/* Action Floating Buttons Bar when selection is ready */}
          {hasSelection && !isSelecting && (
            <div className="absolute -bottom-12 right-0 flex items-center gap-2 bg-zinc-900 border border-zinc-700 p-1 rounded-xl shadow-2xl pointer-events-auto area-action-btn">
              <Button
                size="sm"
                onClick={handleConfirm}
                className="h-7 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg gap-1.5 shadow"
              >
                <Check size={14} />
                Capturar Área
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-7 w-7 p-0 text-zinc-400 hover:text-white rounded-lg"
                title="Cancelar"
              >
                <X size={14} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
