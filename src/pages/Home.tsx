import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Settings,
  Lock,
  Globe,
  EyeOff,
  Share2,
  Code2,
  Eye,
  Columns,
  Monitor,
  Smartphone,
  Tablet,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  History,
  Plus,
  MousePointer,
  Keyboard,
  PanelLeft,
  PanelRight,
  Terminal,
} from "lucide-react";
import { ElementInspector, INSPECTOR_INJECT_SCRIPT } from "../components/ElementInspector";
import { DevToolsSuite, DEVTOOLS_INJECT_SCRIPT } from "../components/DevToolsSuite";
import { CodeDXSuite } from "../components/CodeDXSuite";
import { ShortcutsModal } from "../components/ShortcutsModal";
import { saveRecentSnippet } from "../lib/history";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";

import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "json",
  "sql",
  "java",
  "csharp",
  "cpp",
  "go",
  "rust",
  "php",
  "ruby",
  "shell",
  "markdown",
  "plaintext",
];

export function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  const [code, setCode] = useState(() => {
    const saved = localStorage.getItem("snippet_draft_code");
    return (
      saved || "<!-- Paste your HTML code here -->\n<h1>Hello World</h1>\n"
    );
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("snippet_draft_lang") || "html";
  });
  const [title, setTitle] = useState(() => {
    return localStorage.getItem("snippet_draft_title") || "";
  });
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [password, setPassword] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"code" | "preview" | "split">("split");
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const monacoEditorRef = useRef<any>(null);

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

  // Handle Forked Snippet Initialization
  useEffect(() => {
    if (location.state?.forkedSnippet) {
      const s = location.state.forkedSnippet;
      setCode(s.code || "");
      setLanguage(s.language || "plaintext");
      setTitle(s.title ? `${s.title} (Fork)` : "Forked Snippet");
      setDescription(s.description || "");
      setTags(s.tags || "");

      if (s.language === "html" || s.language === "css") {
        setViewMode("split");
      } else {
        setViewMode("code");
      }

      // Clear the state so it doesn't re-trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Auto-save draft
  useEffect(() => {
    if (!location.state?.forkedSnippet) {
      localStorage.setItem("snippet_draft_code", code);
      localStorage.setItem("snippet_draft_lang", language);
      localStorage.setItem("snippet_draft_title", title);
    }
  }, [code, language, title, location.state]);

  const handleSubmit = async () => {
    if (!code.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          title,
          description,
          tags,
          visibility,
          password: password || undefined,
          expiresInDays: expiresInDays || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create snippet");
      }

      // Save to local history
      saveRecentSnippet({
        id: data.id,
        title: title || "Untitled Snippet",
        language: language,
        timestamp: Date.now(),
      });

      // Clear draft after successful share
      localStorage.removeItem("snippet_draft_code");
      localStorage.removeItem("snippet_draft_lang");
      localStorage.removeItem("snippet_draft_title");

      toast.success("Snippet created successfully!");
      navigate(`/s/${data.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Error creating snippet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const editorContent = (
    <Editor
      height="100%"
      language={language}
      theme="vs-dark"
      value={code}
      onChange={(value) => setCode(value || "")}
      onMount={(editor) => {
        monacoEditorRef.current = editor;
      }}
      options={{
        wordWrap: "on",
        minimap: { enabled: false },
        fontSize: 15,
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
  );

  const getSrcDoc = () => {
    const combinedScript = `${INSPECTOR_INJECT_SCRIPT}\n${DEVTOOLS_INJECT_SCRIPT}`;
    if (language === "html") {
      if (code.includes("</body>")) {
        return code.replace("</body>", `${combinedScript}\n</body>`);
      }
      return `${code}\n${combinedScript}`;
    }
    if (language === "css") {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 2rem; font-family: system-ui, -apple-system, sans-serif; }
              ${code}
            </style>
          </head>
          <body>
            <div class="preview-container">
              <h1>CSS Preview</h1>
              <p>This is a sample paragraph to test your CSS styling in real-time.</p>
              <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button style="padding: 0.5rem 1rem; cursor: pointer;">Button 1</button>
                <button style="padding: 0.5rem 1rem; cursor: pointer; background: #3b82f6; color: white; border: none; rounded: 4px;">Button 2</button>
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

  const previewContent = (viewMode === "split" || (viewMode === "preview" && previewDevice === "desktop")) ? (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden relative">
      <div className="flex-1 relative bg-white overflow-hidden">
        <iframe
          ref={iframeRef}
          srcDoc={getSrcDoc()}
          title="Preview"
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-modals allow-forms allow-popups"
        />
      </div>
      {(language === "html" || language === "css") && (
        <ElementInspector
          iframeRef={iframeRef}
          code={code}
          onCodeChange={setCode}
          isInspectMode={isInspectMode}
          setIsInspectMode={setIsInspectMode}
        />
      )}
    </div>
  ) : (
    <div className="w-full h-full bg-zinc-950 overflow-auto flex flex-col">
      <div className="min-w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
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
            ref={iframeRef}
            srcDoc={getSrcDoc()}
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
        </div>
      </div>
      {(language === "html" || language === "css") && (
        <ElementInspector
          iframeRef={iframeRef}
          code={code}
          onCodeChange={setCode}
          isInspectMode={isInspectMode}
          setIsInspectMode={setIsInspectMode}
        />
      )}
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-[#1e1e1e] overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar */}
        <div className="h-12 bg-[#1e1e1e] border-b border-[#2b2b2b] flex items-center justify-between px-4 shrink-0 z-40 gap-4 overflow-x-auto no-scrollbar">
          {/* File Info */}
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-zinc-400 shrink-0" />
            <Input
              placeholder="Untitled Snippet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 w-48 bg-transparent border-none focus-visible:ring-1 focus-visible:ring-zinc-700 shadow-none text-zinc-100 font-medium px-2 rounded-md"
            />
          </div>

          {/* Actions & Toggles */}
          <div className="flex items-center gap-3">
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

            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                if (e.target.value !== "html" && e.target.value !== "css") setViewMode("code");
              }}
              className="h-8 rounded-md border border-zinc-800 bg-[#1e1e1e] px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>

            {(language === "html" || language === "css") && (
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

            {/* DX Suite: Format, Snippets, AI Refactor, Diff */}
            <CodeDXSuite
              code={code}
              language={language}
              onCodeChange={setCode}
              monacoEditorRef={monacoEditorRef}
            />

            {(language === "html" || language === "css") && (
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

            <Button
              className="h-8 rounded-md px-4 shadow-sm hover:shadow-md transition-all text-xs text-white"
              onClick={handleSubmit}
              disabled={isSubmitting || !code.trim()}
            >
              <Share2 size={13} className="mr-1.5" />
              {isSubmitting ? "Saving..." : "Share"}
            </Button>
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="flex-1 relative overflow-hidden">
          {viewMode === "split" ? (
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
          )}
        </div>
      </div>
      <DevToolsSuite
        iframeRef={iframeRef}
        code={code}
        onCodeChange={setCode}
        isOpen={isDevToolsOpen}
        onClose={() => setIsDevToolsOpen(false)}
        isInspectMode={isInspectMode}
        setIsInspectMode={setIsInspectMode}
      />
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
