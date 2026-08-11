import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Copy,
  Check,
  Lock,
  Calendar,
  Tag as TagIcon,
  ZoomIn,
  ZoomOut,
  Code2,
  Eye,
  Columns,
  GitFork,
  Monitor,
  Smartphone,
  Tablet,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  History,
  Plus,
  Download,
  MousePointer,
  Keyboard,
  PanelLeft,
  PanelRight,
  Terminal,
  Type,
} from "lucide-react";
import { ElementInspector, INSPECTOR_INJECT_SCRIPT } from "../components/ElementInspector";
import { DevToolsSuite, DEVTOOLS_INJECT_SCRIPT } from "../components/DevToolsSuite";
import { PREVIEW_ROUTER_INJECT_SCRIPT } from "../lib/previewRouter";
import { PreviewAddressBar } from "../components/PreviewAddressBar";
import { CodeDXSuite } from "../components/CodeDXSuite";
import { ShortcutsModal } from "../components/ShortcutsModal";
import { DownloadModal } from "../components/DownloadModal";
import { GoogleFontsModal } from "../components/GoogleFontsModal";
import { ScreenCaptureModal } from "../components/ScreenCaptureModal";
import { ScreenCaptureButton } from "../components/ScreenCaptureButton";
import { AreaSelectorOverlay } from "../components/AreaSelectorOverlay";
import { captureIframeCanvas, cropCanvas } from "../lib/capture";
import { GOOGLE_FONTS_PRELOAD_LINK } from "../lib/fonts";
import { format } from "date-fns";
import { saveRecentSnippet } from "../lib/history";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";

export function ViewSnippet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [fontSize, setFontSize] = useState(15);
  const [viewMode, setViewMode] = useState<"code" | "preview" | "split">("code");
  const [splitLayout, setSplitLayout] = useState<"left" | "right">("left");
  const [previewDevice, setPreviewDevice] = useState<
    "desktop" | "iphone" | "ipad"
  >("desktop");
  const [previewOrientation, setPreviewOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isFontsOpen, setIsFontsOpen] = useState(false);
  const [previewCurrentPath, setPreviewCurrentPath] = useState<string>("/");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const monacoEditorRef = useRef<any>(null);

  // Screen Capture States
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [capturedDimensions, setCapturedDimensions] = useState<{ width: number; height: number } | null>(null);
  const [captureType, setCaptureType] = useState<"full" | "area">("full");
  const [isCapturingArea, setIsCapturingArea] = useState(false);
  const previewFrameContainerRef = useRef<HTMLDivElement>(null);

  const handleCaptureFullPage = async () => {
    const loadingToast = toast.loading("A gerar captura de ecrã da página completa...");
    try {
      const canvas = await captureIframeCanvas(iframeRef.current, { fullPage: true });
      const dataUrl = canvas.toDataURL("image/png");
      setCapturedImageUrl(dataUrl);
      setCapturedDimensions({ width: canvas.width, height: canvas.height });
      setCaptureType("full");
      setCaptureModalOpen(true);
      toast.dismiss(loadingToast);
      toast.success("Captura de ecrã completa concluída!");
    } catch (err) {
      console.error("Erro na captura de ecrã:", err);
      toast.dismiss(loadingToast);
      toast.error("Erro ao gerar captura de ecrã.");
    }
  };

  const handleStartCaptureArea = () => {
    setIsCapturingArea(true);
    toast.info("Desenhe um retângulo no preview para capturar a área.");
  };

  const handleConfirmCaptureArea = async (
    rect: { x: number; y: number; width: number; height: number },
    containerRect: { width: number; height: number }
  ) => {
    const loadingToast = toast.loading("A recortar a área selecionada...");
    try {
      const fullCanvas = await captureIframeCanvas(iframeRef.current, { fullPage: false });
      const croppedCanvas = cropCanvas(fullCanvas, rect, containerRect);
      const dataUrl = croppedCanvas.toDataURL("image/png");

      setCapturedImageUrl(dataUrl);
      setCapturedDimensions({ width: croppedCanvas.width, height: croppedCanvas.height });
      setCaptureType("area");
      setIsCapturingArea(false);
      setCaptureModalOpen(true);

      toast.dismiss(loadingToast);
      toast.success("Área capturada com sucesso!");
    } catch (err) {
      console.error("Erro na captura de área:", err);
      toast.dismiss(loadingToast);
      toast.error("Erro ao recortar a área selecionada.");
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === "preview-router") {
        if (event.data.type === "PREVIEW_NAV_CHANGE") {
          setPreviewCurrentPath(event.data.path || "/");
        } else if (event.data.type === "PREVIEW_NAV_TOAST") {
          if (event.data.toastType === "info") {
            toast.info(event.data.text);
          } else {
            toast.success(event.data.text);
          }
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Skip iframe reload ref for live element inspector updates
  const skipIframeReloadRef = useRef<boolean>(false);
  const [srcDoc, setSrcDoc] = useState<string>("");
  const srcDocTimerRef = useRef<any>(null);

  // External live site inspection state
  const [externalSiteUrl, setExternalSiteUrl] = useState<string | null>(null);

  const handleInspectExternalSite = async (url: string) => {
    let target = url.trim();
    if (!target) return;
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = "https://" + target;
    }
    try {
      toast.info(`Carregando site ${target} para inspeção ao vivo...`);
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao carregar o site");
      }

      updateSnippetCode(data.html);
      setSnippet((prev: any) => (prev ? { ...prev, language: "html" } : prev));
      setExternalSiteUrl(data.url);
      setIsInspectMode(true);
      toast.success(`Site ${data.url} carregado! O código atual foi substituído pelo HTML do site para inspeção.`);
    } catch (err: any) {
      toast.error(err.message || "Não foi possível carregar o site para inspeção.");
    }
  };

  const handleClearExternalSite = () => {
    setExternalSiteUrl(null);
    toast.info("Status de site externo limpo.");
  };

  const buildSrcDoc = (targetCode: string, targetLang: string) => {
    const googleFontsLink = GOOGLE_FONTS_PRELOAD_LINK;
    const combinedScript = `${INSPECTOR_INJECT_SCRIPT}\n${DEVTOOLS_INJECT_SCRIPT}\n${PREVIEW_ROUTER_INJECT_SCRIPT}`;

    if (targetLang === "html") {
      let pageCode = targetCode;

      if (/<head[^>]*>/i.test(pageCode)) {
        pageCode = pageCode.replace(/(<head[^>]*>)/i, `$1\n${googleFontsLink}`);
      } else if (/<html[^>]*>/i.test(pageCode)) {
        pageCode = pageCode.replace(/(<html[^>]*>)/i, `$1\n<head>${googleFontsLink}</head>`);
      } else {
        pageCode = `${googleFontsLink}\n${pageCode}`;
      }

      if (/<\/body>/i.test(pageCode)) {
        pageCode = pageCode.replace(/(<\/body>)/i, `${combinedScript}\n$1`);
      } else if (/<\/html>/i.test(pageCode)) {
        pageCode = pageCode.replace(/(<\/html>)/i, `${combinedScript}\n$1`);
      } else {
        pageCode = pageCode + `\n${combinedScript}`;
      }

      return pageCode;
    }
    if (targetLang === "css") {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            ${googleFontsLink}
            <style>
              body { margin: 0; padding: 2rem; font-family: system-ui, -apple-system, sans-serif; }
              ${targetCode}
            </style>
          </head>
          <body>
            <div class="preview-container">
              <h1>CSS Preview</h1>
              <p>This is a sample paragraph to test your CSS styling in real-time.</p>
              <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button style="padding: 0.5rem 1rem; cursor: pointer;">Button 1</button>
                <button style="padding: 0.5rem 1rem; cursor: pointer; background: #3b82f6; color: white; border: none; border-radius: 4px;">Button 2</button>
              </div>
              <div class="box" style="margin-top: 2rem; width: 100px; height: 100px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                Box
              </div>
              <ul style="margin-top: 1.5rem;">
                <li>Item One</li>
                <li>Item Two</li>
                <li>Item Three</li>
              </ul>
            </div>
            ${combinedScript}
          </body>
        </html>
      `;
    }
    return "";
  };

  const updateSnippetCode = (newCode: string, options?: { isIframeSelfUpdate?: boolean }) => {
    if (options?.isIframeSelfUpdate) {
      skipIframeReloadRef.current = true;
    } else {
      skipIframeReloadRef.current = false;
    }
    setSnippet((prev: any) => (prev ? { ...prev, code: newCode } : prev));
  };

  useEffect(() => {
    if (!snippet?.code) return;

    if (skipIframeReloadRef.current) {
      skipIframeReloadRef.current = false;
      return;
    }

    if (srcDocTimerRef.current) clearTimeout(srcDocTimerRef.current);
    srcDocTimerRef.current = setTimeout(() => {
      setSrcDoc(buildSrcDoc(snippet.code, snippet.language));
    }, 200);

    return () => {
      if (srcDocTimerRef.current) clearTimeout(srcDocTimerRef.current);
    };
  }, [snippet?.code, snippet?.language]);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  useEffect(() => {
    fetchSnippet();
  }, [id]);

  const fetchSnippet = async () => {
    try {
      const res = await fetch(`/api/snippets/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch snippet");
      }
      setSnippet(data);

      if (!data.isProtected) {
        saveRecentSnippet({
          id: data.id,
          title: data.title || "Untitled Snippet",
          language: data.language,
          timestamp: Date.now(),
        });
      }

      if (data.language === "html" || data.language === "css") {
        setViewMode("split");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError("");
    try {
      const res = await fetch(`/api/snippets/${id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to unlock");
      }
      setSnippet(data);

      saveRecentSnippet({
        id: data.id,
        title: data.title || "Untitled Snippet",
        language: data.language,
        timestamp: Date.now(),
      });

      if (data.language === "html" || data.language === "css") {
        setViewMode("split");
      }
    } catch (err: any) {
      setUnlockError(err.message);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCode = () => {
    if (snippet?.code) {
      navigator.clipboard.writeText(snippet.code);
      setCopiedCode(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const downloadCode = () => {
    if (snippet?.code) {
      const blob = new Blob([snippet.code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Determine file extension based on language
      const extMap: Record<string, string> = {
        javascript: "js",
        typescript: "ts",
        python: "py",
        html: "html",
        css: "css",
        json: "json",
        sql: "sql",
        java: "java",
        csharp: "cs",
        cpp: "cpp",
        go: "go",
        rust: "rs",
        php: "php",
        ruby: "rb",
        shell: "sh",
        markdown: "md",
        plaintext: "txt",
      };
      const ext = extMap[snippet.language] || "txt";

      a.download = `${snippet.title ? snippet.title.replace(/[^a-z0-9]/gi, "_").toLowerCase() : "snippet"}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("File downloaded!");
    }
  };

  const handleFork = () => {
    navigate("/", { state: { forkedSnippet: snippet } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <Code2 size={24} className="text-blue-600" />
          </div>
          <div className="text-zinc-500 font-medium">Loading snippet...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6">
        <div className="w-14 h-14 bg-red-950/60 text-red-400 border border-red-900/50 rounded-xl flex items-center justify-center">
          <Lock size={28} />
        </div>
        <div className="text-xl font-semibold text-zinc-200">{error}</div>
        <Link to="/">
          <Button className="rounded-lg h-10 px-6 font-medium">Create New Snippet</Button>
        </Link>
      </div>
    );
  }

  if (snippet?.isProtected) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="w-full max-w-md bg-zinc-950 p-6 rounded-xl border border-zinc-800 shadow-2xl text-center">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 text-emerald-400 rounded-lg flex items-center justify-center mx-auto mb-5">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-1 text-zinc-100">
            Protected Snippet
          </h2>
          <p className="text-zinc-400 text-xs mb-6">
            This snippet requires a password to view.
          </p>
          <form onSubmit={handleUnlock} className="space-y-3">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-lg text-center text-sm bg-zinc-900 border-zinc-800"
              autoFocus
            />
            {unlockError && (
              <p className="text-red-500 text-xs font-medium">{unlockError}</p>
            )}
            <Button
              type="submit"
              className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-sm"
            >
              Unlock Snippet
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#1e1e1e] overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar */}
        <div className="h-12 bg-[#1e1e1e] border-b border-[#2b2b2b] flex items-center justify-between px-4 shrink-0 z-40 gap-4 overflow-x-auto no-scrollbar">
          {/* File Info */}
          <div className="flex items-center gap-2 max-w-sm truncate whitespace-nowrap">
            <Code2 size={18} className="text-zinc-400 shrink-0" />
            <span className="text-zinc-100 font-semibold truncate">
              {snippet.title || "Untitled Snippet"}
            </span>
            <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-xs ml-2 uppercase font-semibold shrink-0">
              {snippet.language}
            </span>
          </div>

          {/* Actions & Toggles */}
          <div className="flex items-center gap-3">
            {(snippet.language === "html" || snippet.language === "css") && (
              <div className="flex items-center gap-2">
                <div className="flex bg-zinc-900 rounded-md p-0.5 border border-zinc-800">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant={viewMode === "code" ? "secondary" : "ghost"}
                          size="sm"
                          className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                          onClick={() => setViewMode("code")}
                        >
                          <Code2 size={13} />
                        </Button>
                      }
                    />
                    <TooltipContent>Code View</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant={viewMode === "split" ? "secondary" : "ghost"}
                          size="sm"
                          className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                          onClick={() => setViewMode("split")}
                        >
                          <Columns size={13} />
                        </Button>
                      }
                    />
                    <TooltipContent>Split View</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant={viewMode === "preview" ? "secondary" : "ghost"}
                          size="sm"
                          className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                          onClick={() => setViewMode("preview")}
                        >
                          <Eye size={13} />
                        </Button>
                      }
                    />
                    <TooltipContent>Live Preview</TooltipContent>
                  </Tooltip>
                </div>

                {viewMode === "split" && (
                  <div className="flex bg-zinc-900/90 rounded-md p-0.5 border border-zinc-800/80 items-center animate-in fade-in duration-200">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant={splitLayout === "left" ? "secondary" : "ghost"}
                            size="sm"
                            className={`h-7 px-2 rounded-md text-xs gap-1 transition-all ${
                              splitLayout === "left"
                                ? "bg-zinc-800 text-emerald-400 font-medium shadow-sm"
                                : "text-zinc-400 hover:text-white"
                            }`}
                            onClick={() => setSplitLayout("left")}
                          >
                            <PanelLeft size={13} />
                            <span className="text-[11px] hidden lg:inline">Left</span>
                          </Button>
                        }
                      />
                      <TooltipContent>Code Left / Preview Right</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant={splitLayout === "right" ? "secondary" : "ghost"}
                            size="sm"
                            className={`h-7 px-2 rounded-md text-xs gap-1 transition-all ${
                              splitLayout === "right"
                                ? "bg-zinc-800 text-emerald-400 font-medium shadow-sm"
                                : "text-zinc-400 hover:text-white"
                            }`}
                            onClick={() => setSplitLayout("right")}
                          >
                            <PanelRight size={13} />
                            <span className="text-[11px] hidden lg:inline">Right</span>
                          </Button>
                        }
                      />
                      <TooltipContent>Preview Left / Code Right</TooltipContent>
                    </Tooltip>

                  </div>
                )}
              </div>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 rounded-md text-xs gap-1.5 bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
                    onClick={() => setShowShortcuts(true)}
                  >
                    <Keyboard size={13} className="text-emerald-400" />
                    <span className="hidden sm:inline">Shortcuts</span>
                  </Button>
                }
              />
              <TooltipContent>Keyboard Hotkeys & DevTools Commands (Cmd+K)</TooltipContent>
            </Tooltip>

            {/* DX Intelligence Suite */}
            {snippet && (
              <CodeDXSuite
                code={snippet.code || ""}
                language={snippet.language || "plaintext"}
                onCodeChange={(newCode) => setSnippet({ ...snippet, code: newCode })}
                monacoEditorRef={monacoEditorRef}
              />
            )}

            {snippet && (snippet.language === "html" || snippet.language === "css") && (
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={isInspectMode ? "default" : "outline"}
                        size="sm"
                        className={`h-8 px-3 rounded-md text-xs gap-1.5 font-medium transition-all ${
                          isInspectMode
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm border-emerald-500"
                            : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
                        }`}
                        onClick={() => setIsInspectMode(!isInspectMode)}
                      >
                        <MousePointer size={13} className={isInspectMode ? "animate-pulse" : ""} />
                        <span>{isInspectMode ? "Inspecting" : "Inspect Elements"}</span>
                      </Button>
                    }
                  />
                  <TooltipContent>Toggle Element Inspector & DOM Editor</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={isDevToolsOpen ? "secondary" : "outline"}
                        size="sm"
                        className={`h-8 px-3 rounded-md text-xs gap-1.5 font-medium transition-all ${
                          isDevToolsOpen
                            ? "bg-zinc-800 text-emerald-400 border border-emerald-500/40 shadow-sm"
                            : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
                        }`}
                        onClick={() => setIsDevToolsOpen(!isDevToolsOpen)}
                      >
                        <Terminal size={13} className="text-emerald-400" />
                        <span>DevTools</span>
                      </Button>
                    }
                  />
                  <TooltipContent>Open Integrated DevTools Suite (Console, Network, Audits, Storage)</TooltipContent>
                </Tooltip>

                <ScreenCaptureButton
                  onCaptureFullPage={handleCaptureFullPage}
                  onStartCaptureArea={handleStartCaptureArea}
                />
              </div>
            )}

            {viewMode === "preview" && (
              <div className="flex bg-zinc-900 rounded-md p-0.5 border border-zinc-800">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                        onClick={() => setPreviewDevice("desktop")}
                      >
                        <Monitor size={13} />
                      </Button>
                    }
                  />
                  <TooltipContent>Desktop</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={previewDevice === "iphone" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                        onClick={() => setPreviewDevice("iphone")}
                      >
                        <Smartphone size={13} />
                      </Button>
                    }
                  />
                  <TooltipContent>iPhone</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant={previewDevice === "ipad" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                        onClick={() => setPreviewDevice("ipad")}
                      >
                        <Tablet size={13} />
                      </Button>
                    }
                  />
                  <TooltipContent>iPad</TooltipContent>
                </Tooltip>
                {previewDevice !== "desktop" && (
                  <>
                    <div className="w-px h-4 bg-zinc-700 mx-1 self-center"></div>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 rounded opacity-80 hover:opacity-100 flex items-center justify-center w-8 px-0"
                            onClick={() =>
                              setPreviewOrientation((o) =>
                                o === "portrait" ? "landscape" : "portrait"
                              )
                            }
                          >
                            <RotateCcw
                              size={13}
                              className={
                                previewOrientation === "landscape"
                                  ? "-rotate-90 transition-transform"
                                  : "transition-transform"
                              }
                            />
                          </Button>
                        }
                      />
                      <TooltipContent>Rotate Device</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={copyLink}
                    variant="outline"
                    className="h-8 rounded-md px-3 shadow-none bg-zinc-900 border-zinc-700 text-xs"
                  >
                    {copiedLink ? (
                      <Check size={13} className="mr-1.5 text-green-500" />
                    ) : (
                      <Copy size={13} className="mr-1.5" />
                    )}
                    {copiedLink ? "Copied" : "Link"}
                  </Button>
                }
              />
              <TooltipContent>Copy link to snippet</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={copyCode}
                    variant="outline"
                    className="h-8 rounded-md px-3 shadow-none bg-zinc-900 border-zinc-700 text-xs"
                  >
                    {copiedCode ? (
                      <Check size={13} className="mr-1.5" />
                    ) : (
                      <Copy size={13} className="mr-1.5" />
                    )}
                    {copiedCode ? "Copied" : "Code"}
                  </Button>
                }
              />
              <TooltipContent>Copy code to clipboard</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={() => setIsFontsOpen(true)}
                    variant="outline"
                    className="h-8 rounded-md px-3 shadow-none bg-zinc-900 border-zinc-700 text-xs text-zinc-200 hover:text-white hover:bg-zinc-800 gap-1.5"
                  >
                    <Type size={13} className="text-cyan-400" />
                    Fonts
                  </Button>
                }
              />
              <TooltipContent>Explore & Live Preview Google Fonts</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    onClick={() => setIsDownloadOpen(true)}
                    variant="outline"
                    className="h-8 rounded-md px-3 shadow-none bg-zinc-900 border-zinc-700 text-xs text-zinc-200 hover:text-white hover:bg-zinc-800 gap-1.5"
                  >
                    <Download size={13} className="text-emerald-400" />
                    Download
                  </Button>
                }
              />
              <TooltipContent>Download snippet (HTML, CSS, ZIP, Standalone)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    onClick={() => {
                        navigate("/", {
                           state: {
                               forkedSnippet: {
                                   code: snippet.code,
                                   language: snippet.language,
                                   title: snippet.title,
                                   description: snippet.description,
                                   tags: snippet.tags
                               }
                           }
                        })
                    }}
                    className="h-8 bg-blue-600 text-white rounded-md px-3 shadow-none border-none hover:bg-blue-700 text-xs"
                  >
                    <GitFork size={13} className="mr-1.5" />
                    Fork
                  </Button>
                }
              />
              <TooltipContent>Fork snippet</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    onClick={downloadCode}
                    className="h-8 rounded-md px-3 shadow-none bg-zinc-900 border-zinc-700 text-xs"
                  >
                    <Download size={13} />
                  </Button>
                }
              />
              <TooltipContent>Download file</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="flex-1 relative overflow-hidden group">
          {(() => {
            const editorContent = (
              <>
                {/* Floating Zoom Controls */}
                <div className="absolute top-6 right-6 z-10 flex items-center gap-1 bg-zinc-800/80 backdrop-blur-md p-1.5 rounded-xl border border-zinc-700/50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-zinc-700"
                    onClick={() => setFontSize((f) => Math.max(10, f - 2))}
                  >
                    <ZoomOut size={16} />
                  </Button>
                  <span className="text-xs font-mono w-8 text-center font-medium">
                    {fontSize}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-zinc-700"
                    onClick={() => setFontSize((f) => Math.min(30, f + 2))}
                  >
                    <ZoomIn size={16} />
                  </Button>
                </div>
                <Editor
                  height="100%"
                  language={snippet.language}
                  theme="vs-dark"
                  value={snippet.code}
                  onChange={(value) => updateSnippetCode(value || "")}
                  onMount={(editor) => {
                    monacoEditorRef.current = editor;
                  }}
                  options={{
                    wordWrap: "on",
                    readOnly: false,
                    minimap: { enabled: false },
                    fontSize: fontSize,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontLigatures: true,
                    padding: { top: 16, bottom: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    lineHeight: 1.6,
                    renderLineHighlight: "all",
                  }}
                />
              </>
            );

            const previewContent = (viewMode === "split" || (viewMode === "preview" && previewDevice === "desktop")) ? (
              <div className="w-full h-full flex flex-col bg-white overflow-hidden relative" ref={previewFrameContainerRef}>
                <div className="flex-1 relative bg-white overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    srcDoc={srcDoc}
                    title="Preview"
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-modals allow-forms allow-popups"
                  />
                  <AreaSelectorOverlay
                    isActive={isCapturingArea}
                    onCancel={() => setIsCapturingArea(false)}
                    onConfirmArea={handleConfirmCaptureArea}
                    containerRef={previewFrameContainerRef}
                  />
                </div>
                {(snippet.language === "html" || snippet.language === "css" || Boolean(externalSiteUrl)) && (
                  <ElementInspector
                    iframeRef={iframeRef}
                    code={snippet.code || ""}
                    onCodeChange={updateSnippetCode}
                    isInspectMode={isInspectMode}
                    setIsInspectMode={setIsInspectMode}
                    externalSiteUrl={externalSiteUrl}
                    onClearExternalSite={handleClearExternalSite}
                    onInspectExternalSite={handleInspectExternalSite}
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-zinc-950 overflow-auto flex flex-col">
                <div className="min-w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
                  <div
                    ref={previewFrameContainerRef}
                    className={`transition-all duration-500 ease-in-out relative bg-zinc-900 shadow-2xl overflow-hidden flex flex-col ${
                      previewDevice === "desktop"
                        ? "w-full flex-1 rounded-xl border border-zinc-800 resize-x mx-auto min-w-[320px] max-w-full"
                        : `flex-shrink-0 ring-1 ring-zinc-800 ${
                            previewDevice === "iphone"
                              ? previewOrientation === "landscape"
                                ? "w-[852px] h-[393px] rounded-[3rem] border-[14px] border-zinc-900"
                                : "w-[393px] h-[852px] rounded-[3rem] border-[14px] border-zinc-900"
                              : previewOrientation === "landscape"
                                ? "w-[1194px] h-[834px] rounded-[2rem] border-[16px] border-zinc-900"
                                : "w-[834px] h-[1194px] rounded-[2rem] border-[16px] border-zinc-900"
                          }`
                    }`}
                  >
                    {previewDevice === "iphone" && (
                      <div
                        className={`absolute z-20 bg-black rounded-full pointer-events-none transition-all duration-500 ${
                          previewOrientation === "landscape"
                            ? "w-7 h-36 left-3 top-1/2 -translate-y-1/2"
                            : "w-36 h-7 top-3 left-1/2 -translate-x-1/2"
                        }`}
                      ></div>
                    )}
                    {previewDevice === "ipad" && (
                      <div
                        className={`absolute z-20 bg-black rounded-full w-2 h-2 pointer-events-none transition-all duration-500 ${
                          previewOrientation === "landscape"
                            ? "left-3 top-1/2 -translate-y-1/2"
                            : "top-3 left-1/2 -translate-x-1/2"
                        }`}
                      ></div>
                    )}
                    <div className="flex-1 relative w-full h-full overflow-hidden">
                      <iframe
                        ref={iframeRef}
                        srcDoc={srcDoc}
                        title="Preview"
                        className={`w-full flex-1 bg-white border-none relative z-10 ${
                          previewDevice === "iphone"
                            ? "rounded-[2.2rem]"
                            : previewDevice === "ipad"
                              ? "rounded-[1.2rem]"
                              : ""
                        }`}
                        sandbox="allow-scripts allow-modals allow-forms allow-popups"
                      />
                      <AreaSelectorOverlay
                        isActive={isCapturingArea}
                        onCancel={() => setIsCapturingArea(false)}
                        onConfirmArea={handleConfirmCaptureArea}
                        containerRef={previewFrameContainerRef}
                      />
                    </div>
                  </div>
                </div>
                {(snippet.language === "html" || snippet.language === "css" || Boolean(externalSiteUrl)) && (
                  <ElementInspector
                    iframeRef={iframeRef}
                    code={snippet.code || ""}
                    onCodeChange={updateSnippetCode}
                    isInspectMode={isInspectMode}
                    setIsInspectMode={setIsInspectMode}
                    externalSiteUrl={externalSiteUrl}
                    onClearExternalSite={handleClearExternalSite}
                    onInspectExternalSite={handleInspectExternalSite}
                  />
                )}
              </div>
            );

            return viewMode === "split" ? (
              <PanelGroup
                key={splitLayout}
                direction="horizontal"
                className="w-full h-full"
              >
                {splitLayout === "left" ? (
                  <>
                    <Panel defaultSize={50} minSize={15} className="relative">
                      {editorContent}
                    </Panel>
                    <PanelResizeHandle className="w-1 cursor-col-resize bg-zinc-800/80 hover:bg-emerald-500 transition-colors z-50 flex items-center justify-center">
                      <div className="w-0.5 h-8 bg-zinc-600 rounded-full" />
                    </PanelResizeHandle>
                    <Panel defaultSize={50} minSize={15} className="bg-zinc-950">
                      {previewContent}
                    </Panel>
                  </>
                ) : (
                  <>
                    <Panel defaultSize={50} minSize={15} className="bg-zinc-950">
                      {previewContent}
                    </Panel>
                    <PanelResizeHandle className="w-1 cursor-col-resize bg-zinc-800/80 hover:bg-emerald-500 transition-colors z-50 flex items-center justify-center">
                      <div className="w-0.5 h-8 bg-zinc-600 rounded-full" />
                    </PanelResizeHandle>
                    <Panel defaultSize={50} minSize={15} className="relative">
                      {editorContent}
                    </Panel>
                  </>
                )}
              </PanelGroup>
            ) : viewMode === "code" ? (
              editorContent
            ) : (
              <div className="w-full h-full bg-zinc-950">
                {previewContent}
              </div>
            );
          })()}
        </div>
      </div>
      {snippet && (
        <DevToolsSuite
          iframeRef={iframeRef}
          code={snippet.code || ""}
          onCodeChange={(newCode) => setSnippet({ ...snippet, code: newCode })}
          isOpen={isDevToolsOpen}
          onClose={() => setIsDevToolsOpen(false)}
          isInspectMode={isInspectMode}
          setIsInspectMode={setIsInspectMode}
        />
      )}
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      {snippet && (
        <DownloadModal
          isOpen={isDownloadOpen}
          onClose={() => setIsDownloadOpen(false)}
          code={snippet.code || ""}
          language={snippet.language || "html"}
          title={snippet.title || "snippet"}
        />
      )}
      <GoogleFontsModal
        isOpen={isFontsOpen}
        onClose={() => setIsFontsOpen(false)}
        onInjectFontToCode={(linkTag) => {
          if (snippet && snippet.code) {
            let updated = snippet.code;
            if (updated.includes("<head>")) {
              updated = updated.replace("<head>", `<head>\n  ${linkTag}`);
            } else {
              updated = `${linkTag}\n${updated}`;
            }
            setSnippet({ ...snippet, code: updated });
          }
        }}
      />
      <ScreenCaptureModal
        isOpen={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
        imageUrl={capturedImageUrl}
        imageDimensions={capturedDimensions}
        captureType={captureType}
        onRecaptureFull={handleCaptureFullPage}
        onRecaptureArea={() => {
          setCaptureModalOpen(false);
          handleStartCaptureArea();
        }}
      />
    </div>
  );
}
