import React, { useState, useEffect } from "react";
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
} from "lucide-react";
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
  const [previewDevice, setPreviewDevice] = useState<
    "desktop" | "iphone" | "ipad"
  >("desktop");
  const [previewOrientation, setPreviewOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");
  const [isDockVisible, setIsDockVisible] = useState(true);

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

      if (data.language === "html") {
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

      if (data.language === "html") {
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
        <div className="w-16 h-16 bg-red-900/30 text-red-400 rounded-2xl flex items-center justify-center">
          <Lock size={32} />
        </div>
        <div className="text-xl font-semibold text-zinc-200">{error}</div>
        <Link to="/">
          <Button className="rounded-xl h-11 px-8">Create New Snippet</Button>
        </Link>
      </div>
    );
  }

  if (snippet?.isProtected) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800/50 shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-900/30 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-zinc-100">
            Protected Snippet
          </h2>
          <p className="text-zinc-400 mb-8">
            This snippet requires a password to view.
          </p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl text-center text-lg bg-zinc-900/50"
              autoFocus
            />
            {unlockError && (
              <p className="text-red-500 text-sm font-medium">{unlockError}</p>
            )}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-md font-semibold shadow-md"
            >
              Unlock Snippet
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-[#1e1e1e] overflow-hidden">
      {/* Dock Toggle Button (Show) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="secondary"
              size="icon"
              className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full shadow-2xl border border-zinc-700/50 bg-zinc-800/80 backdrop-blur-md hover:bg-zinc-700 transition-all duration-500 ${isDockVisible ? "translate-y-[200%] opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}
              onClick={() => setIsDockVisible(true)}
            >
              <ChevronUp size={20} />
            </Button>
          }
        />
        <TooltipContent>Show Toolbar</TooltipContent>
      </Tooltip>

      {/* Bottom Dock */}
      <div
        className={`absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center sm:justify-between gap-4 bg-zinc-900/80 backdrop-blur-xl p-3 sm:px-6 sm:py-3 rounded-3xl border border-zinc-800/50 shadow-2xl z-50 w-[calc(100%-2rem)] max-w-5xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isDockVisible ? "translate-y-0 opacity-100" : "translate-y-[150%] opacity-0 pointer-events-none"}`}
      >
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start flex-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 shrink-0"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("open_history"))
                  }
                >
                  <History size={18} />
                </Button>
              }
            />
            <TooltipContent>History</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 shrink-0"
                  onClick={() => navigate("/")}
                >
                  <Plus size={18} />
                </Button>
              }
            />
            <TooltipContent>New Snippet</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-zinc-800 mx-1 hidden sm:block"></div>
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md hidden sm:block">
            <Code2 size={18} />
          </div>
          <div className="flex flex-col justify-center text-center sm:text-left">
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
              <h1 className="text-lg font-bold text-zinc-100 tracking-tight line-clamp-1">
                {snippet.title || "Untitled Snippet"}
              </h1>
              {snippet.language === "html" && (
                <div className="flex bg-zinc-800/80 p-0.5 rounded-xl sm:ml-2">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant={viewMode === "code" ? "secondary" : "ghost"}
                          size="sm"
                          className="h-7 rounded-lg px-2 text-xs shadow-none"
                          onClick={() => setViewMode("code")}
                        >
                          <Code2 size={12} className="mr-1.5" />
                          <span>Code</span>
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
                          className="h-7 rounded-lg px-2 text-xs shadow-none"
                          onClick={() => setViewMode("split")}
                        >
                          <Columns size={12} className="mr-1.5" />
                          <span>Split</span>
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
                          className="h-7 rounded-lg px-2 text-xs shadow-none"
                          onClick={() => setViewMode("preview")}
                        >
                          <Eye size={12} className="mr-1.5" />
                          <span>Preview</span>
                        </Button>
                      }
                    />
                    <TooltipContent>Live Preview</TooltipContent>
                  </Tooltip>
                </div>
              )}
              {viewMode === "preview" && (
                <div className="flex bg-zinc-800/80 p-1 rounded-xl sm:ml-2">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant={
                            previewDevice === "desktop" ? "secondary" : "ghost"
                          }
                          size="sm"
                          className="h-7 rounded-lg px-2 text-xs shadow-none"
                          onClick={() => setPreviewDevice("desktop")}
                        >
                          <Monitor size={12} />
                        </Button>
                      }
                    />
                    <TooltipContent>Desktop</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant={
                            previewDevice === "iphone" ? "secondary" : "ghost"
                          }
                          size="sm"
                          className="h-7 rounded-lg px-2 text-xs shadow-none"
                          onClick={() => setPreviewDevice("iphone")}
                        >
                          <Smartphone size={12} />
                        </Button>
                      }
                    />
                    <TooltipContent>iPhone</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant={
                            previewDevice === "ipad" ? "secondary" : "ghost"
                          }
                          size="sm"
                          className="h-7 rounded-lg px-2 text-xs shadow-none"
                          onClick={() => setPreviewDevice("ipad")}
                        >
                          <Tablet size={12} />
                        </Button>
                      }
                    />
                    <TooltipContent>iPad</TooltipContent>
                  </Tooltip>
                  {previewDevice !== "desktop" && (
                    <>
                      <div className="w-px h-3 bg-zinc-700 mx-1 self-center"></div>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 rounded-lg px-2 text-xs shadow-none"
                              onClick={() =>
                                setPreviewOrientation((o) =>
                                  o === "portrait" ? "landscape" : "portrait",
                                )
                              }
                            >
                              <RotateCcw
                                size={12}
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
            </div>
            {snippet.description && (
              <p className="text-zinc-400 text-xs line-clamp-1 max-w-md mt-0.5 mx-auto sm:mx-0">
                {snippet.description}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1 text-xs font-medium text-zinc-400">
              <div className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-md">
                <Calendar size={12} />
                {format(new Date(snippet.created_at), "MMM d, yyyy")}
              </div>
              <div className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded-md font-mono uppercase tracking-wider">
                {snippet.language}
              </div>
              {snippet.tags && (
                <div className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-md">
                  <TagIcon size={12} />
                  {snippet.tags
                    .split(",")
                    .map((t: string) => t.trim())
                    .join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  onClick={handleFork}
                  className="flex-1 sm:flex-none rounded-xl h-10 shadow-sm bg-zinc-900/50 hover:bg-blue-900/20 hover:text-blue-400 hover:border-blue-800 transition-colors"
                >
                  <GitFork size={16} className="mr-2" />
                  Fork
                </Button>
              }
            />
            <TooltipContent>Fork this snippet</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  onClick={copyLink}
                  className="flex-1 sm:flex-none rounded-xl h-10 shadow-sm bg-zinc-900/50"
                >
                  {copiedLink ? (
                    <Check size={16} className="mr-2 text-green-500" />
                  ) : (
                    <Copy size={16} className="mr-2" />
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
                  className="flex-1 sm:flex-none rounded-xl h-10 shadow-md"
                >
                  {copiedCode ? (
                    <Check size={16} className="mr-2" />
                  ) : (
                    <Copy size={16} className="mr-2" />
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
                  variant="outline"
                  onClick={downloadCode}
                  className="flex-1 sm:flex-none rounded-xl h-10 shadow-sm bg-zinc-900/50"
                >
                  <Download size={16} />
                </Button>
              }
            />
            <TooltipContent>Download file</TooltipContent>
          </Tooltip>

          <div className="w-px h-8 bg-zinc-800 mx-1 hidden sm:block"></div>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                  onClick={() => setIsDockVisible(false)}
                >
                  <ChevronDown size={20} />
                </Button>
              }
            />
            <TooltipContent>Hide Toolbar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="absolute inset-0 z-0 group">
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
                options={{
                  wordWrap: "on",
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: fontSize,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                  padding: { top: 24, bottom: 120 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  domReadOnly: true,
                  lineHeight: 1.6,
                  renderLineHighlight: "none",
                }}
              />
            </>
          );

          const previewContent = (viewMode === "split" || (viewMode === "preview" && previewDevice === "desktop")) ? (
            <div className="w-full h-full bg-white">
              <iframe
                srcDoc={snippet.code}
                title="HTML Preview"
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-modals allow-forms allow-popups"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-zinc-950 overflow-auto">
              <div className="min-w-full min-h-full flex flex-col items-center justify-center p-4 sm:p-8 pb-32">
                <div
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
                  {previewDevice === "desktop" && (
                    <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-4 shrink-0">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="bg-zinc-950 text-zinc-400 text-xs px-4 py-1.5 rounded-md flex items-center gap-2 border border-zinc-800 w-full max-w-md justify-center shadow-inner">
                          <Lock size={12} className="text-zinc-500" />
                          <span>preview.localhost</span>
                        </div>
                      </div>
                      <div className="w-12"></div>
                    </div>
                  )}
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
                  <iframe
                    srcDoc={snippet.code}
                    title="HTML Preview"
                    className={`w-full flex-1 bg-white border-none relative z-10 ${
                      previewDevice === "iphone"
                        ? "rounded-[2.2rem]"
                        : previewDevice === "ipad"
                          ? "rounded-[1.2rem]"
                          : ""
                    }`}
                    sandbox="allow-scripts allow-modals allow-forms allow-popups"
                  />
                </div>
              </div>
            </div>
          );

          if (viewMode === "split") {
            return (
              <PanelGroup direction="horizontal" className="w-full h-full">
                <Panel defaultSize={50} minSize={20} className="relative">
                  {editorContent}
                </Panel>
                <PanelResizeHandle className="w-2 bg-zinc-900 hover:bg-blue-600 transition-colors cursor-col-resize flex items-center justify-center z-50">
                  <div className="w-1 h-8 bg-zinc-700 rounded-full" />
                </PanelResizeHandle>
                <Panel defaultSize={50} minSize={20}>
                  {previewContent}
                </Panel>
              </PanelGroup>
            );
          }

          return viewMode === "code" ? editorContent : previewContent;
        })()}
      </div>
    </div>
  );
}
