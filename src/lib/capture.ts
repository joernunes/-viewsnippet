import html2canvas from "html2canvas";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Captures full iframe or element content using html2canvas
 */
export async function captureIframeCanvas(
  iframeEl: HTMLIFrameElement | null,
  options?: { fullPage?: boolean }
): Promise<HTMLCanvasElement> {
  if (!iframeEl) {
    throw new Error("Iframe não encontrado.");
  }

  // 1. Try capturing iframe contentDocument
  try {
    const doc = iframeEl.contentDocument || iframeEl.contentWindow?.document;
    if (doc && doc.body) {
      const targetElement = options?.fullPage
        ? doc.documentElement || doc.body
        : doc.body;

      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scale: window.devicePixelRatio > 1 ? window.devicePixelRatio : 2,
        logging: false,
        windowWidth: targetElement.scrollWidth || targetElement.clientWidth || 1280,
        windowHeight: options?.fullPage
          ? Math.max(targetElement.scrollHeight, targetElement.clientHeight, 720)
          : targetElement.clientHeight || 720,
      });

      return canvas;
    }
  } catch (err) {
    console.warn("Direct iframe doc capture failed, falling back to parent container:", err);
  }

  // 2. Fallback: capture parent container of iframe
  const target = iframeEl.parentElement || iframeEl;
  const canvas = await html2canvas(target, {
    useCORS: true,
    allowTaint: true,
    scale: window.devicePixelRatio > 1 ? window.devicePixelRatio : 2,
    logging: false,
  });

  return canvas;
}

/**
 * Crops a specific region from a source canvas
 */
export function cropCanvas(
  sourceCanvas: HTMLCanvasElement,
  rect: CropRect,
  containerRect: { width: number; height: number }
): HTMLCanvasElement {
  const scaleX = sourceCanvas.width / containerRect.width;
  const scaleY = sourceCanvas.height / containerRect.height;

  const cropX = Math.max(0, rect.x * scaleX);
  const cropY = Math.max(0, rect.y * scaleY);
  const cropW = Math.min(sourceCanvas.width - cropX, rect.width * scaleX);
  const cropH = Math.min(sourceCanvas.height - cropY, rect.height * scaleY);

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = Math.max(1, Math.round(cropW));
  croppedCanvas.height = Math.max(1, Math.round(cropH));

  const ctx = croppedCanvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      sourceCanvas,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      croppedCanvas.width,
      croppedCanvas.height
    );
  }

  return croppedCanvas;
}
