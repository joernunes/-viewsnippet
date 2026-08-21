import JSZip from "jszip";

/**
 * Downloads the pre-built Extension ZIP from the server or falls back to client-side JSZip packaging.
 */
export async function downloadExtensionZip(): Promise<void> {
  try {
    // Try fetching from direct server route
    const response = await fetch("/api/download-extension-zip");
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "edge-sidepanel-inspector-extension.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      return;
    }
  } catch (err) {
    console.warn("Direct download route failed, falling back to static public file:", err);
  }

  // Fallback to static public link
  const a = document.createElement("a");
  a.href = "/edge-sidepanel-inspector-extension.zip";
  a.download = "edge-sidepanel-inspector-extension.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
