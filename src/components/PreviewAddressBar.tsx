import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Lock,
  Copy,
  Check,
  Compass,
  ExternalLink,
  Search,
  Globe,
  Loader2,
  Camera,
  Crop,
  ChevronDown,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface PreviewAddressBarProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  currentPath: string;
  setCurrentPath: (path: string) => void;
  onRefresh: () => void;
  code?: string;
  externalSiteUrl?: string | null;
  onInspectExternalSite?: (url: string) => void;
  onClearExternalSite?: () => void;
  onImportSite?: (html: string, url: string) => void;
  onCaptureFullPage?: () => void;
  onStartCaptureArea?: () => void;
}

export function PreviewAddressBar({
  iframeRef,
  currentPath,
  setCurrentPath,
  onRefresh,
  code = "",
  externalSiteUrl = null,
  onInspectExternalSite,
  onClearExternalSite,
  onImportSite,
  onCaptureFullPage,
  onStartCaptureArea,
}: PreviewAddressBarProps) {
  const [inputUrl, setInputUrl] = useState(externalSiteUrl || currentPath || "/");
  const [copied, setCopied] = useState(false);
  const [historyStack, setHistoryStack] = useState<string[]>(["/"]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [isCaptureMenuOpen, setIsCaptureMenuOpen] = useState(false);
  const captureMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (captureMenuRef.current && !captureMenuRef.current.contains(e.target as Node)) {
        setIsCaptureMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync internal inputUrl when externalSiteUrl or currentPath changes
  useEffect(() => {
    if (externalSiteUrl) {
      setInputUrl(externalSiteUrl);
    } else if (currentPath) {
      setInputUrl(currentPath);
    }
  }, [externalSiteUrl, currentPath]);

  // Extract anchors and sections from code for quick navigation menu
  const detectedSections = React.useMemo(() => {
    if (!code) return [];
    const sections: string[] = [];
    const idMatches = code.matchAll(/id=["']([^"']+)["']/g);
    for (const match of idMatches) {
      const id = match[1];
      if (
        id &&
        !sections.includes(`#${id}`) &&
        !id.startsWith("inspector") &&
        !id.startsWith("monaco")
      ) {
        sections.push(`#${id}`);
      }
    }
    const hrefMatches = code.matchAll(/href=["'](#\w+|[a-zA-Z0-9_\-\/]+)["']/g);
    for (const match of hrefMatches) {
      const href = match[1];
      if (
        href &&
        href !== "#" &&
        !href.startsWith("http") &&
        !sections.includes(href)
      ) {
        sections.push(href.startsWith("#") || href.startsWith("/") ? href : `/${href}`);
      }
    }
    return sections.slice(0, 8);
  }, [code]);

  const handleNavigateToInput = (e: React.FormEvent) => {
    e.preventDefault();
    let clean = inputUrl.trim();
    if (!clean) clean = "/";

    const isExternal =
      clean.startsWith("http://") ||
      clean.startsWith("https://") ||
      clean.startsWith("www.") ||
      /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+/.test(clean);

    if (isExternal) {
      if (onInspectExternalSite) {
        onInspectExternalSite(clean);
        return;
      }
    }

    if (!clean.startsWith("/") && !clean.startsWith("#") && !clean.startsWith("http")) {
      clean = "/" + clean;
    }

    setCurrentPath(clean);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { target: "preview-iframe", type: "PREVIEW_NAV_GO_TO", url: clean },
        "*"
      );
    }
    toast.success(`Navegado para ${clean}`);
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      const targetPath = historyStack[newIdx];
      setInputUrl(targetPath);
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { target: "preview-iframe", type: "PREVIEW_NAV_GO_BACK" },
          "*"
        );
      }
    }
  };

  const handleGoForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      const targetPath = historyStack[newIdx];
      setInputUrl(targetPath);
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { target: "preview-iframe", type: "PREVIEW_NAV_GO_FORWARD" },
          "*"
        );
      }
    }
  };

  const handleCopyUrl = () => {
    const fullUrl = `https://preview.localhost${inputUrl.startsWith("/") ? "" : "/"}${inputUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Preview URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-11 bg-zinc-900 border-b border-zinc-800 flex items-center px-3 gap-2 shrink-0 z-20">
      {/* Window Controls Dot Indicators */}
      <div className="hidden sm:flex gap-1.5 mr-1">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
      </div>

      {/* Navigation Buttons: Back, Forward, Refresh */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={historyIndex <= 0}
          onClick={handleGoBack}
          className="h-7 w-7 p-0 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30"
          title="Go Back in Preview History"
        >
          <ChevronLeft size={15} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={historyIndex >= historyStack.length - 1}
          onClick={handleGoForward}
          className="h-7 w-7 p-0 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30"
          title="Go Forward in Preview History"
        >
          <ChevronRight size={15} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-7 w-7 p-0 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          title="Refresh Preview"
        >
          <RotateCw size={13} />
        </Button>

        {/* Screen Capture Menu Trigger */}
        {(onCaptureFullPage || onStartCaptureArea) && (
          <div className="relative" ref={captureMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCaptureMenuOpen(!isCaptureMenuOpen)}
              className="h-7 px-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1 text-xs font-medium border border-zinc-800/80"
              title="Captura de Ecrã (Página Completa / Seleccionar Área)"
            >
              <Camera size={14} className="text-cyan-400 shrink-0" />
              <span className="hidden sm:inline text-[11px]">Capturar</span>
              <ChevronDown size={12} className={`text-zinc-500 transition-transform ${isCaptureMenuOpen ? "rotate-180" : ""}`} />
            </Button>

            {isCaptureMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 px-2 py-1 font-semibold">
                  Captura de Ecrã
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCaptureMenuOpen(false);
                    if (onCaptureFullPage) onCaptureFullPage();
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-zinc-200 hover:text-white hover:bg-cyan-950/60 rounded-lg transition-colors text-left font-medium group"
                >
                  <Camera size={15} className="text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                  <div className="flex flex-col">
                    <span>Web Page Completa</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Captura toda a página web</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCaptureMenuOpen(false);
                    if (onStartCaptureArea) onStartCaptureArea();
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-zinc-200 hover:text-white hover:bg-cyan-950/60 rounded-lg transition-colors text-left font-medium group"
                >
                  <Crop size={15} className="text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                  <div className="flex flex-col">
                    <span>Capturar Área</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Desenhar retângulo de recorte</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editable Interactive Address Bar */}
      <form onSubmit={handleNavigateToInput} className="flex-1 flex items-center max-w-xl mx-auto gap-2">
        <div className="bg-zinc-950 text-zinc-300 text-xs px-2.5 py-1 rounded-xl flex items-center gap-2 border border-zinc-800/90 w-full shadow-inner focus-within:border-cyan-500/80 transition-colors relative">
          {inputUrl.startsWith("http") || inputUrl.includes(".") ? (
            <Globe size={12} className="text-cyan-400 shrink-0" title="URL Externa de Website" />
          ) : (
            <Lock size={12} className="text-emerald-400 shrink-0" />
          )}

          {!inputUrl.startsWith("http") && !inputUrl.startsWith("www.") && (
            <span className="text-zinc-500 font-mono text-[11px] select-none shrink-0">
              preview.localhost
            </span>
          )}

          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Digite /rota ou cole URL de um site (ex: https://example.com)..."
            className="bg-transparent border-none outline-none text-zinc-200 text-xs font-mono w-full focus:ring-0 px-0"
          />

          <button
            type="button"
            onClick={handleCopyUrl}
            className="text-zinc-500 hover:text-zinc-200 shrink-0 p-0.5 rounded hover:bg-zinc-800 transition-colors"
            title="Copiar URL de Preview"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>

        {externalSiteUrl ? (
          <Button
            type="button"
            size="sm"
            onClick={onClearExternalSite}
            className="h-7 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium rounded-lg shrink-0 gap-1 shadow-sm border border-zinc-700"
            title="Voltar ao preview do código local"
          >
            <span>Voltar ao Código</span>
          </Button>
        ) : (
          (inputUrl.startsWith("http") || inputUrl.startsWith("www.") || (inputUrl.includes(".") && !inputUrl.startsWith("/"))) && (
            <Button
              type="submit"
              size="sm"
              className="h-7 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-medium rounded-lg shrink-0 gap-1 shadow-sm"
              title="Carregar e inspecionar este site no preview"
            >
              <Globe size={12} />
              Inspecionar Site
            </Button>
          )
        )}
      </form>

      {/* Quick Link/Section Pills if detected in code */}
      {detectedSections.length > 0 && (
        <div className="hidden xl:flex items-center gap-1 overflow-x-auto max-w-xs no-scrollbar">
          {detectedSections.map((sec) => (
            <button
              key={sec}
              onClick={() => {
                setInputUrl(sec);
                setCurrentPath(sec);
                if (iframeRef.current && iframeRef.current.contentWindow) {
                  iframeRef.current.contentWindow.postMessage(
                    { target: "preview-iframe", type: "PREVIEW_NAV_GO_TO", url: sec },
                    "*"
                  );
                }
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium transition-all shrink-0 ${
                currentPath === sec
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                  : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800/80"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
