import React, { useState } from "react";
import {
  Download,
  X,
  Package,
  Layers,
  Sparkles,
  MousePointerClick,
  Palette,
  Camera,
  Code2,
  CheckCircle2,
  ExternalLink,
  Info,
  Terminal,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { Button } from "./ui/button";
import { downloadExtensionZip } from "../lib/extensionZip";
import { toast } from "sonner";

interface EdgeExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EdgeExtensionModal({ isOpen, onClose }: EdgeExtensionModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadExtensionZip();
      toast.success("Download da Extensão Edge (.ZIP) iniciado!");
    } catch (err) {
      toast.error("Erro ao descarregar a extensão. Tente novamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      id="edge-extension-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="edge-extension-modal"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-zinc-950 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with neon cyan accent */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                Extensão Microsoft Edge Side Panel
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  Manifest V3
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Inspecione elementos, edite estilos ao vivo e capture dados em qualquer site no Edge
              </p>
            </div>
          </div>
          <button
            id="close-edge-extension-modal"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-300 text-sm">
          {/* Main Action Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-blue-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-sm font-semibold text-zinc-100 flex items-center justify-center sm:justify-start gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Pacote Completo Pronto para o Edge (.ZIP)
              </div>
              <p className="text-xs text-zinc-400">
                Contém todos os ficheiros: <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">manifest.json</code>, Side Panel, Content Scripts e Ícones.
              </p>
            </div>
            <Button
              id="download-zip-action-btn"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold shadow-lg shadow-cyan-500/20 gap-2 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "A descarregar..." : "Descarregar Extensão (.ZIP)"}
            </Button>
          </div>

          {/* Key Capabilities Grid */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Recursos no Painel Lateral do Edge
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 flex gap-3">
                <MousePointerClick className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium text-xs text-zinc-200">Isolamento Multi-Site Automático</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Sincroniza automaticamente com a aba ativa. Cada site tem seus próprios dados isolados, histórico de nós e estilos.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 flex gap-3">
                <Code2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium text-xs text-zinc-200">Editor e Exportador Tailwind / React</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Altere estilos ao vivo e exporte o elemento selecionado para classes Tailwind CSS, componentes React ou CSS puro.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 flex gap-3">
                <Palette className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium text-xs text-zinc-200">Acessibilidade e Contraste WCAG</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Calculadora de contraste de cores WCAG AA/AAA em tempo real, paleta de cores HEX e inspeção de tipografia.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 flex gap-3">
                <Camera className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium text-xs text-zinc-200">3 Modos de Captura de Ecrã</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Captura da janela visível, recorte interativo por área retangular arrastável ou recorte do elemento selecionado em HD.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Installation Steps Guide */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Como Instalar no Microsoft Edge (3 Passos Rápidos)
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">
                  1
                </span>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-zinc-200">
                    Descompacte o ficheiro <span className="font-mono text-cyan-300">.zip</span> descarregado
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Extraia o conteúdo do ficheiro ZIP para uma pasta no seu computador (por exemplo, em Documentos ou na pasta do projeto).
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">
                  2
                </span>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-zinc-200 flex items-center gap-2">
                    Abra a página de extensões do Edge
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Digite na barra de endereços do Microsoft Edge:{" "}
                    <code className="bg-black/50 text-cyan-300 px-1.5 py-0.5 rounded font-mono select-all">
                      edge://extensions
                    </code>{" "}
                    e ative a opção <strong>"Modo de desenvolvedor"</strong> no menu lateral esquerdo.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">
                  3
                </span>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-zinc-200">
                    Clique em "Carregar sem compactação" (Load unpacked)
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Selecione a pasta descompactada onde está o <code className="font-mono text-cyan-300">manifest.json</code>. A extensão aparecerá imediatamente no Side Panel!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shortcut hint */}
          <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Atalho para alternar inspeção na página:</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <kbd className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-cyan-300">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-cyan-300">Shift</kbd>
              <span>+</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-cyan-300">X</kbd>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/60">
          <span className="text-xs text-zinc-400">
            Compatível com Microsoft Edge e navegadores baseados em Chromium.
          </span>
          <div className="flex items-center gap-2">
            <Button
              id="edge-extension-close-btn"
              variant="outline"
              onClick={onClose}
              className="text-xs border-zinc-700 hover:bg-zinc-800"
            >
              Fechar
            </Button>
            <Button
              id="edge-extension-download-footer-btn"
              onClick={handleDownload}
              disabled={isDownloading}
              className="text-xs bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Descarregar ZIP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
