import { useState, useEffect } from "react";
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
} from "lucide-react";
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
  const [previewDevice, setPreviewDevice] = useState<
    "desktop" | "iphone" | "ipad"
  >("desktop");
  const [previewOrientation, setPreviewOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");
  const [isDockVisible, setIsDockVisible] = useState(true);

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
      options={{
        wordWrap: "on",
        minimap: { enabled: false },
        fontSize: 15,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        padding: { top: 24, bottom: 120 },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        lineHeight: 1.6,
        renderLineHighlight: "all",
      }}
    />
  );

  const getSrcDoc = () => {
    if (language === "html") return code;
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
          </body>
        </html>
      `;
    }
    return "";
  };

  const previewContent = (viewMode === "split" || (viewMode === "preview" && previewDevice === "desktop")) ? (
    <div className="w-full h-full bg-white">
      <iframe
        srcDoc={getSrcDoc()}
        title="Preview"
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
    </div>
  );

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
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start flex-1">
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
                  onClick={() => (window.location.href = "/")}
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
          <Input
            placeholder="Untitled Snippet"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent placeholder:text-zinc-600 min-w-[150px] text-center sm:text-left"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {(language === "html" || language === "css") && (
            <div className="flex bg-zinc-800/80 p-1 rounded-xl mr-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant={viewMode === "code" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-8 rounded-lg px-3 shadow-none"
                      onClick={() => setViewMode("code")}
                    >
                      <Code2 size={14} className="sm:mr-2" />
                      <span className="hidden sm:inline">Code</span>
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
                      className="h-8 rounded-lg px-3 shadow-none"
                      onClick={() => setViewMode("split")}
                    >
                      <Columns size={14} className="sm:mr-2" />
                      <span className="hidden sm:inline">Split</span>
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
                      className="h-8 rounded-lg px-3 shadow-none"
                      onClick={() => setViewMode("preview")}
                    >
                      <Eye size={14} className="sm:mr-2" />
                      <span className="hidden sm:inline">Preview</span>
                    </Button>
                  }
                />
                <TooltipContent>Live Preview</TooltipContent>
              </Tooltip>
            </div>
          )}
          {viewMode === "preview" && (
            <div className="flex bg-zinc-800/80 p-1 rounded-xl mr-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant={
                        previewDevice === "desktop" ? "secondary" : "ghost"
                      }
                      size="sm"
                      className="h-8 rounded-lg px-3 shadow-none"
                      onClick={() => setPreviewDevice("desktop")}
                    >
                      <Monitor size={14} />
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
                      className="h-8 rounded-lg px-3 shadow-none"
                      onClick={() => setPreviewDevice("iphone")}
                    >
                      <Smartphone size={14} />
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
                      className="h-8 rounded-lg px-3 shadow-none"
                      onClick={() => setPreviewDevice("ipad")}
                    >
                      <Tablet size={14} />
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
                          className="h-8 rounded-lg px-3 shadow-none"
                          onClick={() =>
                            setPreviewOrientation((o) =>
                              o === "portrait" ? "landscape" : "portrait",
                            )
                          }
                        >
                          <RotateCcw
                            size={14}
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
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              if (e.target.value !== "html") setViewMode("code");
            }}
            className="h-10 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md font-medium"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className="rounded-xl h-10 px-4 transition-all bg-zinc-900/50"
                >
                  <Settings size={16} className="sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              }
            />
            <PopoverContent
              className="w-80 sm:w-96 p-6 bg-zinc-900/95 backdrop-blur-xl border-zinc-800/50 rounded-2xl shadow-2xl mb-4"
              side="top"
              align="end"
            >
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-400">
                    Description
                  </Label>
                  <Input
                    id="description"
                    placeholder="Brief description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-zinc-900/50 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-zinc-400">
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    placeholder="react, node, sql..."
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="bg-zinc-900/50 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Visibility</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={visibility === "public" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVisibility("public")}
                      className="w-full justify-center rounded-xl h-10"
                    >
                      <Globe size={14} className="mr-2" /> Public
                    </Button>
                    <Button
                      type="button"
                      variant={
                        visibility === "unlisted" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setVisibility("unlisted")}
                      className="w-full justify-center rounded-xl h-10"
                    >
                      <EyeOff size={14} className="mr-2" /> Unlisted
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-400">
                    Password Protection
                  </Label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Optional password"
                      className="pl-9 bg-zinc-900/50 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  className="rounded-xl h-10 px-6 shadow-md hover:shadow-lg transition-all"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !code.trim()}
                >
                  <Share2 size={16} className="mr-2" />
                  {isSubmitting ? "Saving..." : "Share"}
                </Button>
              }
            />
            <TooltipContent>Save and Share Snippet</TooltipContent>
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
      <div className="absolute inset-0 z-0">
        {viewMode === "split" ? (
          <PanelGroup direction="horizontal" className="w-full h-full">
            <Panel defaultSize={50} minSize={20}>
              {editorContent}
            </Panel>
            <PanelResizeHandle className="w-2 bg-zinc-900 hover:bg-blue-600 transition-colors cursor-col-resize flex items-center justify-center z-50">
              <div className="w-1 h-8 bg-zinc-700 rounded-full" />
            </PanelResizeHandle>
            <Panel defaultSize={50} minSize={20}>
              {previewContent}
            </Panel>
          </PanelGroup>
        ) : viewMode === "code" ? (
          editorContent
        ) : (
          previewContent
        )}
      </div>
    </div>
  );
}
