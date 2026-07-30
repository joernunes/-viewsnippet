import React, { useState, useEffect } from "react";
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
}

export function PreviewAddressBar({
  iframeRef,
  currentPath,
  setCurrentPath,
  onRefresh,
  code = "",
}: PreviewAddressBarProps) {
  const [inputUrl, setInputUrl] = useState(currentPath || "/");
  const [copied, setCopied] = useState(false);
  const [historyStack, setHistoryStack] = useState<string[]>(["/"]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Sync internal inputUrl when currentPath changes from iframe messages
  useEffect(() => {
    if (currentPath) {
      setInputUrl(currentPath);
      // Track in history stack if different from last item
      setHistoryStack((prev) => {
        if (prev[historyIndex] === currentPath) return prev;
        const newStack = [...prev.slice(0, historyIndex + 1), currentPath];
        setHistoryIndex(newStack.length - 1);
        return newStack;
      });
    }
  }, [currentPath]);

  // Extract anchors and sections from code for quick navigation menu
  const detectedSections = React.useMemo(() => {
    if (!code) return [];
    const sections: string[] = [];
    // Match id="..." or href="#..."
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
    toast.success(`Navigated preview to ${clean}`);
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
      </div>

      {/* Editable Interactive Address Bar */}
      <form onSubmit={handleNavigateToInput} className="flex-1 flex items-center max-w-xl mx-auto">
        <div className="bg-zinc-950 text-zinc-300 text-xs px-2.5 py-1 rounded-xl flex items-center gap-2 border border-zinc-800/90 w-full shadow-inner focus-within:border-cyan-500/80 transition-colors">
          <Lock size={12} className="text-emerald-400 shrink-0" />
          <span className="text-zinc-500 font-mono text-[11px] select-none shrink-0">
            preview.localhost
          </span>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="/ or #section"
            className="bg-transparent border-none outline-none text-zinc-200 text-xs font-mono w-full focus:ring-0 px-0"
          />
          <button
            type="button"
            onClick={handleCopyUrl}
            className="text-zinc-500 hover:text-zinc-200 shrink-0 p-0.5 rounded hover:bg-zinc-800 transition-colors"
            title="Copy Simulated Preview URL"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>
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
