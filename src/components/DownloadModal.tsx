import React, { useState } from "react";
import JSZip from "jszip";
import {
  Download,
  FileCode2,
  FileType,
  FileArchive,
  Copy,
  Check,
  X,
  FileText,
  Sparkles,
  Layers,
  Code2,
  Package,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { downloadExtensionZip } from "../lib/extensionZip";
import { toast } from "sonner";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: string;
  title?: string;
}

export function DownloadModal({
  isOpen,
  onClose,
  code,
  language,
  title = "snippet",
}: DownloadModalProps) {
  const [fileName, setFileName] = useState(
    title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "my-snippet"
  );
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const sanitizeName = fileName.trim() || "snippet";

  // Helper to trigger browser file download
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getExtension = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "html":
        return ".html";
      case "css":
        return ".css";
      case "javascript":
      case "js":
        return ".js";
      case "typescript":
      case "ts":
        return ".ts";
      case "jsx":
      case "tsx":
        return ".tsx";
      case "json":
        return ".json";
      case "python":
      case "py":
        return ".py";
      case "markdown":
      case "md":
        return ".md";
      case "sql":
        return ".sql";
      case "cpp":
      case "c++":
        return ".cpp";
      case "java":
        return ".java";
      default:
        return ".txt";
    }
  };

  // Standalone HTML generator with Google Fonts & Reset CSS
  const generateStandaloneHtml = () => {
    const googleFontsLink = `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`;

    if (language === "html") {
      if (code.includes("<html") || code.includes("<!DOCTYPE") || code.includes("<head>")) {
        return code.includes("<head>")
          ? code.replace("<head>", `<head>\n  ${googleFontsLink}`)
          : `${googleFontsLink}\n${code}`;
      }
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "Exported Snippet"}</title>
  ${googleFontsLink}
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
  </style>
</head>
<body>
${code}
</body>
</html>`;
    }

    if (language === "css") {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "Exported CSS Snippet"}</title>
  ${googleFontsLink}
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 2rem; font-family: 'Inter', sans-serif; background: #09090b; color: #f4f4f5; }
    ${code}
  </style>
</head>
<body>
  <div className="demo-container">
    <h1>${title || "CSS Preview"}</h1>
    <p>This standalone HTML includes your CSS code.</p>
  </div>
</body>
</html>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "Exported Code"}</title>
  ${googleFontsLink}
  <style>
    body { margin: 0; padding: 2rem; font-family: 'JetBrains Mono', monospace; background: #0d1117; color: #e6edf3; }
    pre { padding: 1.5rem; background: #161b22; border-radius: 12px; border: 1px solid #30363d; overflow-x: auto; }
  </style>
</head>
<body>
  <h2>${title}</h2>
  <pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
</body>
</html>`;
  };

  // Download raw single file
  const handleDownloadSingleFile = () => {
    const ext = getExtension(language);
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `${sanitizeName}${ext}`);
  };

  // Download Standalone HTML file
  const handleDownloadStandaloneHtml = () => {
    const htmlContent = generateStandaloneHtml();
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, `${sanitizeName}.html`);
  };

  // Download CSS file
  const handleDownloadCss = () => {
    const cssContent = language === "css" ? code : `/* Exported Styles for ${title} */\n/* Add your custom styles here */\n`;
    const blob = new Blob([cssContent], { type: "text/css;charset=utf-8" });
    downloadBlob(blob, `${sanitizeName}.css`);
  };

  // Download Full ZIP Archive
  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      if (language === "html") {
        zip.file("index.html", generateStandaloneHtml());
        zip.file("code.html", code);
      } else if (language === "css") {
        zip.file("style.css", code);
        zip.file("index.html", generateStandaloneHtml());
      } else {
        const ext = getExtension(language);
        zip.file(`script${ext}`, code);
        zip.file("index.html", generateStandaloneHtml());
      }

      zip.file(
        "README.md",
        `# ${title}\n\nGenerated with ViewSnippet Studio.\n\n## Files\n- \`index.html\`: Ready-to-run web file with embedded Google Fonts.\n- \`code${getExtension(language)}\`: Main code source.\n`
      );

      const content = await zip.generateAsync({ type: "blob" });
      downloadBlob(content, `${sanitizeName}-project.zip`);
    } catch (err) {
      console.error("Failed to generate ZIP", err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyCode = (type: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0 text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Download size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Download & Export Options</h3>
              <p className="text-[11px] text-zinc-400">Export snippet as HTML, CSS, Raw File, or ZIP Package</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* File Name Config */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-300 font-medium">File Name</Label>
            <div className="flex items-center gap-2">
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="my-snippet"
                className="h-9 bg-zinc-950 border-zinc-800 text-xs font-mono rounded-lg flex-1 focus:border-emerald-500"
              />
              <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2.5 py-2 border border-zinc-800 rounded-lg">
                {getExtension(language)}
              </span>
            </div>
          </div>

          {/* Download Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Direct Raw Code File */}
            <button
              onClick={handleDownloadSingleFile}
              className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/80 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileCode2 size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-white flex items-center gap-1">
                  Raw File ({getExtension(language)})
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Download exact {language.toUpperCase()} source file
                </p>
              </div>
            </button>

            {/* Standalone Ready HTML */}
            <button
              onClick={handleDownloadStandaloneHtml}
              className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/80 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileType size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                  Standalone Web (.html)
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Complete ready-to-open HTML with Google Fonts
                </p>
              </div>
            </button>

            {/* CSS File */}
            <button
              onClick={handleDownloadCss}
              className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/80 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                  Stylesheet (.css)
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Export clean CSS styles only
                </p>
              </div>
            </button>

            {/* Complete ZIP Package */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/80 transition-all text-left group disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileArchive size={16} />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                  {isZipping ? "Packaging ZIP..." : "Project ZIP (.zip)"}
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Includes HTML, CSS, JS and README documentation
                </p>
              </div>
            </button>

            {/* Edge Extension ZIP */}
            <button
              onClick={async () => {
                try {
                  await downloadExtensionZip();
                  toast.success("Download da Extensão Microsoft Edge (.ZIP) iniciado!");
                } catch (e) {
                  toast.error("Erro ao descarregar extensão.");
                }
              }}
              className="sm:col-span-2 flex items-start gap-3 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-900/30 transition-all text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Package size={16} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-300 flex items-center gap-1.5">
                  <span>Extensão Microsoft Edge Side Panel (.ZIP)</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Manifest V3
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Pacote completo da extensão para inspecionar e editar elementos em qualquer site web no painel lateral do Edge.
                </p>
              </div>
            </button>
          </div>

          {/* Quick Copy Section */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 size={15} className="text-zinc-400" />
              <span className="text-xs text-zinc-300 font-medium">Quick Copy Raw Source</span>
            </div>
            <Button
              size="sm"
              onClick={() => handleCopyCode("raw", code)}
              className="h-7 px-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg gap-1.5"
            >
              {copiedType === "raw" ? (
                <>
                  <Check size={12} className="text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy Code
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 flex justify-end">
          <Button
            onClick={onClose}
            className="h-8 px-4 text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
