import React, { useState, useEffect } from "react";
import {
  Camera,
  Crop,
  Download,
  Copy,
  Check,
  X,
  Maximize2,
  RefreshCw,
  Sparkles,
  FileImage,
  Layers,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ScreenCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  imageDimensions: { width: number; height: number } | null;
  captureType: "full" | "area";
  onRecaptureFull: () => void;
  onRecaptureArea: () => void;
}

export function ScreenCaptureModal({
  isOpen,
  onClose,
  imageUrl,
  imageDimensions,
  captureType,
  onRecaptureFull,
  onRecaptureArea,
}: ScreenCaptureModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [imageUrl]);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const time = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `captura-${captureType === "full" ? "completa" : "area"}-${time}.png`;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Captura descarregada: ${filename}`);
  };

  const handleCopyToClipboard = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
        setCopied(true);
        toast.success("Imagem copiada para a área de transferência!");
        setTimeout(() => setCopied(false), 2500);
      } else {
        toast.error("O seu navegador não suporta cópia direta de imagens.");
      }
    } catch (err) {
      console.error("Erro ao copiar imagem:", err);
      toast.error("Não foi possível copiar a imagem.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              {captureType === "full" ? <Camera size={20} /> : <Crop size={20} />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Captura de Ecrã
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-cyan-400 border border-zinc-700">
                  {captureType === "full" ? "Página Completa" : "Área Selecionada"}
                </span>
              </h3>
              {imageDimensions && (
                <p className="text-xs text-zinc-400 font-mono">
                  Dimensões: {imageDimensions.width}px × {imageDimensions.height}px • Formato PNG
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-zinc-400 hover:text-white rounded-lg h-8 w-8 p-0"
            title="Fechar"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Image Preview Container */}
        <div className="flex-1 overflow-auto p-6 bg-zinc-950/80 flex items-center justify-center min-h-[300px] max-h-[60vh] relative group">
          <div className="relative border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] max-w-full">
            <img
              src={imageUrl}
              alt="Captura de Ecrã"
              className="max-w-full max-h-[50vh] object-contain mx-auto rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900 flex flex-wrap items-center justify-between gap-3">
          {/* Left Recapture options */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRecaptureFull}
              className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200 text-xs h-9 gap-1.5 rounded-xl"
            >
              <Camera size={14} className="text-cyan-400" />
              Recapturar Página Completa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRecaptureArea}
              className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200 text-xs h-9 gap-1.5 rounded-xl"
            >
              <Crop size={14} className="text-cyan-400" />
              Recapturar Área
            </Button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                toast.info("Captura descartada / removida.");
              }}
              className="bg-zinc-800 hover:bg-red-950/60 hover:text-red-300 border-zinc-700 text-zinc-300 text-xs h-9 gap-1.5 rounded-xl"
              title="Remover e descartar imagem capturada"
            >
              <Trash2 size={14} className="text-zinc-400 hover:text-red-400" />
              Remover
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToClipboard}
              className="bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200 text-xs h-9 gap-1.5 rounded-xl"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "Copiado!" : "Copiar Imagem"}
            </Button>

            <Button
              size="sm"
              onClick={handleDownload}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs h-9 gap-2 rounded-xl shadow-lg shadow-cyan-950/40"
            >
              <Download size={14} />
              Descarregar PNG
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
