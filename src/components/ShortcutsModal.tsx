import React from "react";
import { X, Command, Keyboard, MousePointer, Eye, Code2, Sparkles, Layers, Box } from "lucide-react";
import { Button } from "./ui/button";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: "Inspector & DOM DevTools",
      items: [
        { keys: ["Cmd", "Shift", "C"], desc: "Toggle Live Element Inspector Mode" },
        { keys: ["Click Element"], desc: "Select and view element properties & box model" },
        { keys: ["Double Click"], desc: "Direct inline text editing inside iframe canvas" },
        { keys: ["Breadcrumb Click"], desc: "Traverse parent DOM hierarchy" },
        { keys: ["Delete / Backspace"], desc: "Remove selected element from DOM" },
      ],
    },
    {
      category: "Code Editor & Navigation",
      items: [
        { keys: ["Cmd", "Z"], desc: "Undo last code / style change" },
        { keys: ["Cmd", "Shift", "Z"], desc: "Redo last undone change" },
        { keys: ["Cmd", "S"], desc: "Share / Save snippet to cloud" },
        { keys: ["Cmd", "K"], desc: "Open Shortcuts Command Palette" },
        { keys: ["Esc"], desc: "Deselect inspector element / close overlays" },
      ],
    },
    {
      category: "Studio Styling & Presets",
      items: [
        { keys: ["Styles Tab"], desc: "Live Box Model margin/padding/border adjustment" },
        { keys: ["Presets"], desc: "Apply Glassmorphism, Neon Glow & Modern styles" },
        { keys: ["Classes Tab"], desc: "Quick Tailwind & custom CSS class manager" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-emerald-400">
              <Keyboard size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                Keyboard Shortcuts & Studio Commands
              </h3>
              <p className="text-[11px] text-zinc-400">Pro Developer Studio Hotkeys</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X size={15} />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          {shortcuts.map((cat, idx) => (
            <div key={`cat-${idx}`} className="space-y-2">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                {idx === 0 && <MousePointer size={12} />}
                {idx === 1 && <Command size={12} />}
                {idx === 2 && <Box size={12} />}
                {cat.category}
              </h4>
              <div className="bg-zinc-900/50 rounded-lg border border-zinc-800/80 divide-y divide-zinc-800/60 overflow-hidden">
                {cat.items.map((item, itemIdx) => (
                  <div key={`item-${itemIdx}`} className="flex items-center justify-between p-2.5 px-3 text-xs">
                    <span className="text-zinc-300 font-medium">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={`k-${kIdx}`}
                          className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-700/80 text-[10px] font-mono text-zinc-300 shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-5 bg-zinc-900/60 border-t border-zinc-800 text-center text-[11px] text-zinc-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-zinc-400">
            <Sparkles size={13} className="text-emerald-400" /> Studio Mode Active
          </span>
          <Button
            size="sm"
            onClick={onClose}
            className="h-7 px-4 bg-zinc-100 hover:bg-white text-zinc-950 text-xs rounded-md font-semibold transition-colors"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
