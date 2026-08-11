import React, { useState, useRef, useEffect } from "react";
import { Camera, Crop, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";

interface ScreenCaptureButtonProps {
  onCaptureFullPage: () => void;
  onStartCaptureArea: () => void;
  className?: string;
}

export function ScreenCaptureButton({
  onCaptureFullPage,
  onStartCaptureArea,
  className = "",
}: ScreenCaptureButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-2.5 rounded-md text-xs gap-1.5 bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 font-medium"
        title="Captura de Ecrã (Página Completa / Selecionar Área)"
      >
        <Camera size={13} className="text-cyan-400 shrink-0" />
        <span className="hidden sm:inline">Capturar</span>
        <ChevronDown
          size={12}
          className={`text-zinc-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-[70] flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 px-2 py-1 font-semibold">
            Captura de Ecrã
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onCaptureFullPage();
            }}
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-zinc-200 hover:text-white hover:bg-cyan-950/60 rounded-lg transition-colors text-left font-medium group"
          >
            <Camera
              size={15}
              className="text-cyan-400 group-hover:scale-110 transition-transform shrink-0"
            />
            <div className="flex flex-col">
              <span>Web Page Completa</span>
              <span className="text-[10px] text-zinc-500 font-normal">
                Captura toda a página
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onStartCaptureArea();
            }}
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-zinc-200 hover:text-white hover:bg-cyan-950/60 rounded-lg transition-colors text-left font-medium group"
          >
            <Crop
              size={15}
              className="text-cyan-400 group-hover:scale-110 transition-transform shrink-0"
            />
            <div className="flex flex-col">
              <span>Capturar Área</span>
              <span className="text-[10px] text-zinc-500 font-normal">
                Desenhar retângulo de recorte
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
