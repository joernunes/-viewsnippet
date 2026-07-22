import React, { useState } from "react";
import {
  Wand2,
  Sparkles,
  Code2,
  FileCode,
  Layers,
  Check,
  Copy,
  AlertCircle,
  AlertTriangle,
  Info,
  GitCompare,
  X,
  Play,
  Zap,
  Palette,
  ShieldCheck,
  Moon,
  Flame,
  Search,
  BookOpen,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { DiffEditor } from "@monaco-editor/react";
import { toast } from "sonner";

// --- SNIPPET PRESETS LIBRARY ---
export interface CodeSnippetItem {
  id: string;
  title: string;
  category: "Tailwind UI" | "JavaScript / TS" | "CSS Magic" | "Layouts";
  description: string;
  language: string;
  code: string;
}

export const SNIPPET_LIBRARY: CodeSnippetItem[] = [
  {
    id: "hero-glass",
    title: "Glassmorphism Hero Section",
    category: "Tailwind UI",
    description: "Modern landing hero section with glass backdrop blur and gradient mesh",
    language: "html",
    code: `<section className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden p-6">
  <div className="relative z-10 max-w-3xl text-center bg-slate-900/80 border border-slate-800 p-8 rounded-xl shadow-2xl space-y-5">
    <span className="inline-block px-3 py-1 rounded-md text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      ⚡ Ultra-Fast Developer Tools
    </span>
    <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
      Build & Share Code <span className="text-emerald-400">Instantly</span>
    </h1>
    <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
      An elegant, cloud-synchronized snippet engine equipped with live DOM inspection and integrated DevTools.
    </p>
    <div className="flex flex-wrap justify-center gap-3 pt-2">
      <button className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-sm">
        Get Started Free
      </button>
      <button className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-colors">
        View Snippets
      </button>
    </div>
  </div>
</section>`,
  },
  {
    id: "bento-grid",
    title: "Bento Feature Grid",
    category: "Tailwind UI",
    description: "Multi-tier feature showcase layout with dark card styling",
    language: "html",
    code: `<div className="max-w-5xl mx-auto p-6 bg-zinc-950 text-zinc-100 rounded-xl border border-zinc-800">
  <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
    <h2 className="text-2xl font-bold tracking-tight">Crafted for High Performance</h2>
    <p className="text-zinc-400 text-xs">Everything you need to inspect, debug, and format your code in record time.</p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    <div className="md:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
      <div className="text-emerald-400 font-mono text-xs uppercase font-semibold mb-2">01 / DevTools Suite</div>
      <h3 className="text-lg font-semibold text-white mb-1.5">Integrated Inspector & Console</h3>
      <p className="text-zinc-400 text-xs leading-relaxed">Inspect DOM tree hierarchy, modify styles on the fly, and execute live REPL commands.</p>
    </div>

    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
      <div className="text-emerald-400 font-mono text-xs uppercase font-semibold mb-2">02 / Code Intelligence</div>
      <h3 className="text-base font-semibold text-white mb-1.5">Auto Formatting</h3>
      <p className="text-zinc-400 text-xs leading-relaxed">One-click Prettier-style formatting and snippet library.</p>
    </div>

    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
      <div className="text-emerald-400 font-mono text-xs uppercase font-semibold mb-2">03 / Core Web Vitals</div>
      <h3 className="text-base font-semibold text-white mb-1.5">Real-time Audits</h3>
      <p className="text-zinc-400 text-xs leading-relaxed">Lighthouse scores for performance and accessibility.</p>
    </div>

    <div className="md:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors">
      <div className="text-emerald-400 font-mono text-xs uppercase font-semibold mb-2">04 / Instant Sharing</div>
      <h3 className="text-lg font-semibold text-white mb-1.5">Password Protected Snippets</h3>
      <p className="text-zinc-400 text-xs leading-relaxed">Share code with custom expiration timers, view count tracking, and password protection.</p>
    </div>
  </div>
</div>`,
  },
  {
    id: "async-fetch",
    title: "Robust Fetch API with Retry & Timeout",
    category: "JavaScript / TS",
    description: "Production-ready fetch wrapper featuring retry attempts and abort controller timeout",
    language: "javascript",
    code: `async function fetchWithRetry(url, options = {}, retries = 3, timeoutMs = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(\`[Fetch] Requesting \${url} (Attempt \${attempt}/\${retries})...\`);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(\`HTTP Error status \${response.status}\`);
      }

      const data = await response.json();
      console.log('[Fetch] Success:', data);
      return data;
    } catch (err) {
      clearTimeout(timer);
      console.warn(\`[Fetch] Attempt \${attempt} failed: \${err.message}\`);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }
}

// Example Usage:
// fetchWithRetry('https://api.github.com/zen')
//   .then(data => console.log(data))
//   .catch(err => console.error('All retries failed:', err));`,
  },
  {
    id: "glass-scrollbar-css",
    title: "Neon Glass & Custom Scrollbar CSS",
    category: "CSS Magic",
    description: "Stylized webkit scrollbars, neon text glows, and smooth scrolling",
    language: "css",
    code: `/* Modern Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #09090b;
}

::-webkit-scrollbar-thumb {
  background: #27272a;
  border-radius: 9999px;
  border: 2px solid #09090b;
}

::-webkit-scrollbar-thumb:hover {
  background: #10b981;
}

/* Neon Text Glow Effect */
.neon-glow {
  color: #34d399;
  text-shadow: 0 0 10px rgba(52, 211, 153, 0.6),
               0 0 20px rgba(52, 211, 153, 0.4),
               0 0 30px rgba(52, 211, 153, 0.2);
}

/* Glassmorphism Card Style */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
}`,
  },
];

interface CodeDXSuiteProps {
  code: string;
  language: string;
  onCodeChange: (newCode: string) => void;
  monacoEditorRef?: any;
}

export function CodeDXSuite({
  code,
  language,
  onCodeChange,
  monacoEditorRef,
}: CodeDXSuiteProps) {
  const [isSnippetsOpen, setIsSnippetsOpen] = useState(false);
  const [isAiRefactorOpen, setIsAiRefactorOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [initialCodeSnapshot] = useState(code);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefactoring, setIsRefactoring] = useState(false);

  // Auto Code Formatter
  const handleFormatCode = () => {
    try {
      if (monacoEditorRef?.current) {
        monacoEditorRef.current.getAction("editor.action.formatDocument")?.run();
        toast.success("Code formatted cleanly!");
        return;
      }

      // Fallback client-side basic indentation beautifier
      if (language === "json") {
        const parsed = JSON.parse(code);
        onCodeChange(JSON.stringify(parsed, null, 2));
        toast.success("JSON formatted!");
      } else if (language === "html" || language === "css" || language === "javascript") {
        let indent = 0;
        const lines = code.split("\n");
        const formatted = lines
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return "";
            if (trimmed.startsWith("</") || trimmed.startsWith("}")) {
              indent = Math.max(0, indent - 1);
            }
            const padded = "  ".repeat(indent) + trimmed;
            if (
              (trimmed.startsWith("<") && !trimmed.startsWith("</") && !trimmed.endsWith("/>") && !trimmed.includes("</")) ||
              trimmed.endsWith("{")
            ) {
              indent++;
            }
            return padded;
          })
          .join("\n");

        onCodeChange(formatted);
        toast.success("Code formatted!");
      } else {
        toast.info("Auto-formatting triggered!");
      }
    } catch (e) {
      toast.error("Format failed. Check syntax errors.");
    }
  };

  // AI Code Refactoring Presets
  const handleAiRefactor = (mode: string) => {
    setIsRefactoring(true);
    setTimeout(() => {
      let result = code;

      if (mode === "tailwind") {
        // Enhance HTML classes
        if (language === "html") {
          result = code
            .replace(/<button>/g, '<button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors shadow-sm">')
            .replace(/<h1>/g, '<h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">')
            .replace(/<p>/g, '<p className="text-slate-400 leading-relaxed">')
            .replace(/<div class="/g, '<div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl shadow-xl ');
        }
        toast.success("Applied modern Tailwind UI styling!");
      } else if (mode === "a11y") {
        // Add alt tags and aria labels
        result = code
          .replace(/<img /g, '<img alt="Descriptive image" ')
          .replace(/<button/g, '<button aria-label="Interactive action button"')
          .replace(/<input /g, '<input aria-label="Input field" ');
        toast.success("Enhanced accessibility (a11y) & ARIA attributes!");
      } else if (mode === "dark") {
        if (language === "html" || language === "css") {
          result = `<!-- Dark Mode Enabled -->\n<div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">\n${code}\n</div>`;
        }
        toast.success("Wrapped with dark theme context!");
      } else if (mode === "clean") {
        handleFormatCode();
        setIsRefactoring(false);
        setIsAiRefactorOpen(false);
        return;
      }

      onCodeChange(result);
      setIsRefactoring(false);
      setIsAiRefactorOpen(false);
    }, 600);
  };

  const filteredSnippets = SNIPPET_LIBRARY.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* DX Toolbar Actions */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFormatCode}
          className="h-7 px-2.5 text-xs rounded-md gap-1 bg-zinc-900/90 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
          title="Prettier Code Formatter"
        >
          <Wand2 size={13} className="text-emerald-400" />
          <span className="hidden sm:inline">Format Code</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSnippetsOpen(true)}
          className="h-7 px-2.5 text-xs rounded-md gap-1 bg-zinc-900/90 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
          title="Code Snippet Library"
        >
          <BookOpen size={13} className="text-amber-400" />
          <span className="hidden sm:inline">Snippets</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAiRefactorOpen(true)}
          className="h-7 px-2.5 text-xs rounded-md gap-1 bg-zinc-900/90 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
          title="AI Code Refactoring Assistant"
        >
          <Sparkles size={13} className="text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">Smart Refactor</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDiffOpen(true)}
          className="h-7 px-2.5 text-xs rounded-md gap-1 bg-zinc-900/90 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all"
          title="Compare Code Diff"
        >
          <GitCompare size={13} className="text-sky-400" />
          <span className="hidden sm:inline">Diff</span>
        </Button>
      </div>

      {/* --- SNIPPETS LIBRARY DIALOG --- */}
      <Dialog open={isSnippetsOpen} onOpenChange={setIsSnippetsOpen}>
        <DialogContent className="max-w-3xl w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-0 rounded-xl shadow-2xl overflow-hidden">
          <DialogHeader className="p-5 pb-4 bg-zinc-900/60 border-b border-zinc-800/80">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-zinc-100">
              <BookOpen size={16} className="text-emerald-400" />
              Code Snippets & Template Library
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-1">
              Insert battle-tested Tailwind UI sections, JS utility hooks, and CSS styling templates.
            </DialogDescription>

            <div className="relative mt-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search templates (e.g. Hero, Fetch, Bento, Glass)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-950 border-zinc-800 text-xs text-white rounded-md h-9 focus-visible:ring-emerald-500/50"
              />
            </div>
          </DialogHeader>

          <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
            {filteredSnippets.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 rounded-lg p-3.5 flex flex-col justify-between gap-3 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-100">{item.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{item.description}</p>
                </div>

                <div className="flex justify-end gap-2 pt-2.5 border-t border-zinc-800/60">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(item.code);
                      toast.success("Snippet copied to clipboard!");
                    }}
                    className="h-7 px-3 text-xs border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-md"
                  >
                    <Copy size={12} className="mr-1.5" /> Copy
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      onCodeChange(item.code);
                      setIsSnippetsOpen(false);
                      toast.success(`Loaded "${item.title}" into editor!`);
                    }}
                    className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md shadow-sm"
                  >
                    Insert Code
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- AI SMART REFACTOR DIALOG --- */}
      <Dialog open={isAiRefactorOpen} onOpenChange={setIsAiRefactorOpen}>
        <DialogContent className="max-w-md w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-0 rounded-xl shadow-2xl overflow-hidden">
          <DialogHeader className="p-5 bg-zinc-900/60 border-b border-zinc-800/80">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-zinc-100">
              <Sparkles size={16} className="text-emerald-400" />
              Smart Code Refactor Assistant
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-1">
              Transform and modernize your snippet instantly using intelligence presets.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-2.5">
            <button
              onClick={() => handleAiRefactor("tailwind")}
              disabled={isRefactoring}
              className="w-full p-3 bg-zinc-900/40 border border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 rounded-lg text-left flex items-start gap-3 transition-colors group"
            >
              <Palette size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-zinc-100 block">Modernize UI with Tailwind CSS</span>
                <span className="text-[11px] text-zinc-400 block mt-0.5 leading-normal">
                  Applies high-contrast dark theme colors, crisp borders, and shadow accents.
                </span>
              </div>
            </button>

            <button
              onClick={() => handleAiRefactor("a11y")}
              disabled={isRefactoring}
              className="w-full p-3 bg-zinc-900/40 border border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 rounded-lg text-left flex items-start gap-3 transition-colors group"
            >
              <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-zinc-100 block">Accessibility & ARIA Enhancer</span>
                <span className="text-[11px] text-zinc-400 block mt-0.5 leading-normal">
                  Adds missing alt attributes, aria-labels, and semantic accessibility tags.
                </span>
              </div>
            </button>

            <button
              onClick={() => handleAiRefactor("dark")}
              disabled={isRefactoring}
              className="w-full p-3 bg-zinc-900/40 border border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 rounded-lg text-left flex items-start gap-3 transition-colors group"
            >
              <Moon size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-zinc-100 block">Wrap with Dark Theme Canvas</span>
                <span className="text-[11px] text-zinc-400 block mt-0.5 leading-normal">
                  Embeds full-screen dark mode background and typography rules.
                </span>
              </div>
            </button>

            <button
              onClick={() => handleAiRefactor("clean")}
              disabled={isRefactoring}
              className="w-full p-3 bg-zinc-900/40 border border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 rounded-lg text-left flex items-start gap-3 transition-colors group"
            >
              <Zap size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-zinc-100 block">Clean & Standardize Formatting</span>
                <span className="text-[11px] text-zinc-400 block mt-0.5 leading-normal">
                  Removes extra whitespaces and standardizes code indentation.
                </span>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- DIFF COMPARISON DIALOG --- */}
      <Dialog open={isDiffOpen} onOpenChange={setIsDiffOpen}>
        <DialogContent className="max-w-5xl w-[92vw] h-[82vh] bg-zinc-950 border border-zinc-800 text-zinc-100 p-0 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <DialogHeader className="p-4 px-5 bg-zinc-900/60 border-b border-zinc-800/80 shrink-0">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-zinc-100">
              <GitCompare size={16} className="text-emerald-400" />
              Code Version Comparison (Diff View)
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-0.5">
              Original Draft (Left) vs. Current Code (Right)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 border-b border-zinc-800 overflow-hidden bg-zinc-950">
            <DiffEditor
              original={initialCodeSnapshot}
              modified={code}
              language={language}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
              }}
            />
          </div>

          <div className="p-3 px-5 flex justify-end shrink-0 bg-zinc-900/40">
            <Button size="sm" onClick={() => setIsDiffOpen(false)} className="h-8 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-md">
              Close Diff
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
