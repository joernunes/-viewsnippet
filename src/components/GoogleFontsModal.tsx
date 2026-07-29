import React, { useState } from "react";
import {
  Type,
  Search,
  Check,
  Copy,
  Sparkles,
  X,
  Code2,
  Sliders,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  POPULAR_GOOGLE_FONTS,
  GoogleFontItem,
  getFontCssImport,
  getFontHtmlLink,
} from "../lib/fonts";
import { toast } from "sonner";

interface GoogleFontsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFontToSelectedElement?: (fontFamily: string) => void;
  onInjectFontToCode?: (fontLink: string) => void;
}

export function GoogleFontsModal({
  isOpen,
  onClose,
  onApplyFontToSelectedElement,
  onInjectFontToCode,
}: GoogleFontsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [previewText, setPreviewText] = useState(
    "Sphinx of black quartz, judge my vow."
  );
  const [fontSizePreview, setFontSizePreview] = useState<number>(24);
  const [copiedFont, setCopiedFont] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ["All", "Sans-Serif", "Serif", "Monospace", "Display & Creative"];

  const filteredFonts = POPULAR_GOOGLE_FONTS.filter((font) => {
    const matchesCategory =
      selectedCategory === "All" || font.category === selectedCategory;
    const matchesSearch =
      font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      font.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      font.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyCode = (fontName: string, type: "link" | "import" | "css") => {
    let textToCopy = "";
    if (type === "link") {
      textToCopy = getFontHtmlLink(fontName);
    } else if (type === "import") {
      textToCopy = getFontCssImport(fontName);
    } else {
      textToCopy = `font-family: ${fontName};`;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopiedFont(`${fontName}-${type}`);
    toast.success(`Copied ${type.toUpperCase()} for ${fontName}!`);
    setTimeout(() => setCopiedFont(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Type size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                Google Fonts Explorer & Live Preview
                <span className="bg-cyan-950 text-cyan-400 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-cyan-800/80">
                  {POPULAR_GOOGLE_FONTS.length} Preloaded
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Preview, apply, and copy preloaded web typography for instant render
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Filters & Preview Controls Bar */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/90 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fonts (e.g., Inter, JetBrains, Playfair)..."
                className="pl-9 h-8 bg-zinc-950 border-zinc-800 text-xs rounded-xl focus:border-cyan-500"
              />
            </div>

            {/* Custom Preview Text */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <Input
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Type custom text to preview..."
                className="h-8 bg-zinc-950 border-zinc-800 text-xs rounded-xl flex-1 focus:border-cyan-500"
              />
              {/* Font size slider */}
              <div className="flex items-center gap-1.5 shrink-0 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-mono">
                  {fontSizePreview}px
                </span>
                <input
                  type="range"
                  min={12}
                  max={48}
                  value={fontSizePreview}
                  onChange={(e) => setFontSizePreview(Number(e.target.value))}
                  className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  selectedCategory === cat
                    ? "bg-cyan-600 text-white shadow-md font-semibold"
                    : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Font List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-zinc-800/40">
          {filteredFonts.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 space-y-2">
              <Type size={32} className="mx-auto text-zinc-600" />
              <p className="text-sm font-medium">No Google Fonts match your query</p>
              <p className="text-xs text-zinc-500">Try searching for another font or clearing category filters.</p>
            </div>
          ) : (
            filteredFonts.map((font) => (
              <div
                key={font.name}
                className="pt-3 first:pt-0 group hover:bg-zinc-950/40 p-3 rounded-xl transition-all border border-transparent hover:border-zinc-800"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-zinc-100 text-sm">
                      {font.name}
                    </h4>
                    {font.badge && (
                      <span className="bg-zinc-800 text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded-full">
                        {font.badge}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {font.category}
                    </span>
                  </div>

                  {/* Actions for Font */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {onApplyFontToSelectedElement && (
                      <Button
                        size="sm"
                        onClick={() => {
                          onApplyFontToSelectedElement(font.family);
                          toast.success(`Applied ${font.name} to selected element!`);
                          onClose();
                        }}
                        className="h-7 px-2.5 text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium shadow-sm gap-1"
                      >
                        <Check size={12} /> Apply to Element
                      </Button>
                    )}

                    {onInjectFontToCode && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onInjectFontToCode(getFontHtmlLink(font.name));
                          toast.success(`Injected ${font.name} link to code head!`);
                        }}
                        className="h-7 px-2.5 text-[11px] bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg gap-1"
                      >
                        <Code2 size={12} className="text-amber-400" /> Inject &lt;link&gt;
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyCode(font.name, "import")}
                      className="h-7 px-2 text-[11px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg gap-1"
                      title="Copy CSS @import"
                    >
                      {copiedFont === `${font.name}-import` ? (
                        <CheckCircle2 size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>@import</span>
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
                  {font.description}
                </p>

                {/* Live Font Sample rendering with inline style */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 overflow-x-auto shadow-inner">
                  <div
                    style={{
                      fontFamily: font.family,
                      fontSize: `${fontSizePreview}px`,
                      lineHeight: "1.3",
                    }}
                    className="text-zinc-100 whitespace-nowrap"
                  >
                    {previewText || "The quick brown fox jumps over the lazy dog."}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Sparkles size={13} className="text-cyan-400" />
            <span>All fonts pre-loaded with optimal CSS Google CDN link</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 px-3 bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs rounded-lg"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
