/**
 * Edge Web Inspector - Sidepanel Controller v2.0
 * Multi-site isolation, 3-mode screen capture, Tailwind exporter, A11y contrast analyzer & tools.
 */

(function () {
  let currentElement = null;
  let isInspectActive = false;
  let activeTabId = null;
  let currentHostname = "local";
  let activeExportTab = "tailwind";

  // Elements cache
  const inspectBtn = document.getElementById("inspectBtn");
  const inspectBtnText = document.getElementById("inspectBtnText");
  const refreshBtn = document.getElementById("refreshBtn");
  const currentSiteBadge = document.getElementById("currentSiteBadge");
  const pageTitle = document.getElementById("pageTitle");
  const emptyState = document.getElementById("emptyState");
  const elementDetails = document.getElementById("elementDetails");
  const emptyInspectBtn = document.getElementById("emptyInspectBtn");
  const toast = document.getElementById("toast");

  // Show Toast Message
  function showToast(text, duration = 2200) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), duration);
  }

  // Active Tab Locator (Handles Edge Sidepanel window vs browser window contexts)
  async function getActiveTab() {
    // 1. Query by lastFocusedWindow (most accurate when triggered from sidepanel)
    let tabs = await new Promise((res) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (t) => {
        if (chrome.runtime.lastError || !t || t.length === 0) res([]);
        else res(t);
      });
    });

    // 2. Query by currentWindow fallback
    if (!tabs || tabs.length === 0) {
      tabs = await new Promise((res) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (t) => {
          if (chrome.runtime.lastError || !t || t.length === 0) res([]);
          else res(t);
        });
      });
    }

    // 3. Query all active tabs fallback
    if (!tabs || tabs.length === 0) {
      tabs = await new Promise((res) => {
        chrome.tabs.query({ active: true }, (t) => {
          if (chrome.runtime.lastError || !t || t.length === 0) res([]);
          else res(t);
        });
      });
    }

    return tabs && tabs.length > 0 ? tabs[0] : null;
  }

  // Dynamic Content Script Injection Helper
  async function ensureContentScriptInjected(tabId) {
    try {
      if (chrome.scripting) {
        await chrome.scripting.insertCSS({
          target: { tabId },
          files: ["content.css"],
        }).catch(() => {});
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content.js"],
        });
        await new Promise((r) => setTimeout(r, 60));
        return true;
      }
    } catch (e) {
      console.warn("Direct script injection attempt failed:", e);
    }

    try {
      const bgRes = await new Promise((res) => {
        chrome.runtime.sendMessage({ action: "INJECT_CONTENT_SCRIPT", tabId }, res);
      });
      if (bgRes && bgRes.success) {
        await new Promise((r) => setTimeout(r, 60));
        return true;
      }
    } catch (e) {}

    return false;
  }

  // Active Tab Communication Helper with Auto-Injection & Auto-Retry
  async function sendToContentScript(message) {
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      return { error: "Nenhuma aba ativa encontrada" };
    }
    activeTabId = tab.id;

    // Guard against browser internal pages (edge://, chrome://, addons store)
    const url = tab.url || "";
    if (
      url.startsWith("edge://") ||
      url.startsWith("chrome://") ||
      url.startsWith("about:") ||
      url.startsWith("view-source:") ||
      url.startsWith("devtools://") ||
      url.includes("microsoftedge.microsoft.com/addons") ||
      url.includes("chromewebstore.google.com")
    ) {
      return { 
        error: "Páginas internas do navegador (edge://) ou lojas de extensões não permitem inspeção por segurança do navegador." 
      };
    }

    // Attempt 1: Direct message
    let response = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, message, (res) => {
        if (chrome.runtime.lastError) {
          resolve({ _connError: chrome.runtime.lastError.message });
        } else {
          resolve(res || {});
        }
      });
    });

    if (response && !response._connError) {
      return response;
    }

    // Attempt 2: Inject content script dynamically into open tab and retry immediately
    const injected = await ensureContentScriptInjected(tab.id);
    if (injected) {
      response = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, message, (res) => {
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message });
          } else {
            resolve(res || {});
          }
        });
      });
      return response;
    }

    return { error: response._connError || "Não foi possível conectar à página ativa" };
  }

  // --- MULTI-SITE SYNC & ISOLATION ---
  async function syncActiveTab() {
    const tab = await getActiveTab();
    if (!tab) return;
    activeTabId = tab.id;

    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
      pageTitle.textContent = tab.title || "Página do Sistema";
      currentSiteBadge.textContent = "Sistema";
      currentHostname = "system";
      updateCustomCssSite(currentHostname);
      return;
    }

    try {
      const urlObj = new URL(tab.url);
      currentHostname = urlObj.hostname;
      currentSiteBadge.textContent = currentHostname.replace(/^www\./, "");
      pageTitle.textContent = tab.title || currentHostname;
    } catch (e) {
      currentHostname = "generic";
      currentSiteBadge.textContent = "Web";
    }

    updateCustomCssSite(currentHostname);

    // Restore site-specific saved element/state from chrome.storage
    loadSiteStoredData(currentHostname);

    // Restore and inject saved custom CSS for this site
    loadSiteCustomCss(currentHostname);

    // Ping content script to check inspection status
    const res = await sendToContentScript({ action: "GET_INSPECT_STATE" });
    if (res && typeof res.isInspectMode === "boolean") {
      updateInspectButton(res.isInspectMode);
    }
  }

  // Load site-isolated persistent cache
  function loadSiteStoredData(hostname) {
    chrome.storage.local.get([`edge_site_${hostname}`], (result) => {
      const data = result[`edge_site_${hostname}`];
      if (data && data.lastElement) {
        currentElement = data.lastElement;
        renderElementDetails(currentElement, false);
      }
    });
  }

  // Save site-isolated persistent cache
  function saveSiteStoredData(hostname, element) {
    if (!hostname || !element) return;
    chrome.storage.local.set({
      [`edge_site_${hostname}`]: {
        lastElement: element,
        updatedAt: Date.now(),
      }
    });
  }

  // Listen for tab switches and page navigations from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "TAB_SWITCHED" || message.action === "TAB_UPDATED") {
      syncActiveTab();
      return;
    }

    if (message.action === "ELEMENT_SELECTED" && message.element) {
      updateInspectButton(false);
      currentElement = message.element;
      renderElementDetails(currentElement, true);
      saveSiteStoredData(message.hostname || currentHostname, currentElement);
      showToast(`<${message.element.tag}> selecionado`);
      return;
    }

    if (message.action === "INSPECTOR_STOPPED" || message.action === "AREA_SELECTION_CANCELLED") {
      updateInspectButton(false);
      return;
    }

    if (message.action === "AREA_CAPTURED" && message.dataUrl) {
      updateInspectButton(false);
      displayCapturePreview(message.dataUrl, `Área • ${message.width} × ${message.height} px`);
      switchTab("tab-capture");
      showToast("Área capturada com sucesso!");
      return;
    }
  });

  // Toggle Inspect Mode
  async function toggleInspect() {
    isInspectActive = !isInspectActive;
    updateInspectButton(isInspectActive);

    const action = isInspectActive ? "START_INSPECTOR" : "STOP_INSPECTOR";
    const res = await sendToContentScript({ action });
    if (res && res.error) {
      showToast(res.error, 3500);
      updateInspectButton(false);
    }
  }

  function updateInspectButton(active) {
    isInspectActive = active;
    if (active) {
      inspectBtn.classList.add("active");
      inspectBtnText.textContent = "Parar";
    } else {
      inspectBtn.classList.remove("active");
      inspectBtnText.textContent = "Inspecionar";
    }
  }

  // Tab Navigation Handling
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  function switchTab(tabId) {
    document.querySelectorAll(".nav-tab").forEach((t) => {
      t.classList.toggle("active", t.getAttribute("data-tab") === tabId);
    });
    document.querySelectorAll(".tab-pane").forEach((pane) => {
      pane.classList.toggle("active", pane.id === tabId);
    });

    if (tabId === "tab-assets") loadPageAssets();
    if (tabId === "tab-tools") {
      loadPageDiagnostics();
      loadSiteStorage();
    }
  }

  // --- RENDER SELECTED ELEMENT DETAILS ---
  function renderElementDetails(elem, switchToTab = true) {
    if (!elem) return;

    emptyState.style.display = "none";
    elementDetails.style.display = "block";

    if (switchToTab) switchTab("tab-element");

    // Tag & Dimensions
    document.getElementById("elemTag").textContent = elem.tag;
    const elemId = document.getElementById("elemId");
    elemId.textContent = elem.id ? `#${elem.id}` : "";
    elemId.title = elem.id ? `#${elem.id}` : "";

    document.getElementById("elemDimensions").textContent = `${elem.rect.width} × ${elem.rect.height} px`;

    // Classes
    const classesRow = document.getElementById("elemClasses");
    if (elem.classes && elem.classes.length > 0) {
      classesRow.textContent = elem.classes.map((c) => `.${c}`).join(" ");
      classesRow.style.display = "block";
    } else {
      classesRow.style.display = "none";
    }

    // DOM Hierarchy Breadcrumb
    const domHierarchy = document.getElementById("domHierarchy");
    domHierarchy.innerHTML = "";
    if (elem.hierarchy && elem.hierarchy.length > 0) {
      elem.hierarchy.forEach((item, index) => {
        const span = document.createElement("span");
        span.className = `breadcrumb-item ${index === elem.hierarchy.length - 1 ? "active" : ""}`;
        span.textContent = item.tag + (item.id ? `#${item.id}` : "");
        span.title = item.selector;

        span.addEventListener("click", async () => {
          const res = await sendToContentScript({
            action: "SELECT_BY_SELECTOR",
            selector: item.selector,
          });
          if (res && res.element) {
            currentElement = res.element;
            renderElementDetails(currentElement, false);
          }
        });

        domHierarchy.appendChild(span);

        if (index < elem.hierarchy.length - 1) {
          const sep = document.createElement("span");
          sep.className = "breadcrumb-sep";
          sep.textContent = "›";
          domHierarchy.appendChild(sep);
        }
      });
    }

    // Live Tweaker Sync
    document.getElementById("tweakFontSize").value = elem.styles.fontSize || "";
    document.getElementById("tweakBorderRadius").value = elem.styles.borderRadius || "";
    document.getElementById("tweakDisplay").value = elem.styles.display || "";
    document.getElementById("tweakOpacity").value = parseFloat(elem.styles.opacity) || 1;

    const hexColor = rgbToHex(elem.styles.color);
    if (hexColor) {
      document.getElementById("tweakColorInput").value = hexColor;
      document.getElementById("tweakColorVal").textContent = hexColor;
    }
    const hexBg = rgbToHex(elem.styles.backgroundColor);
    if (hexBg) {
      document.getElementById("tweakBgInput").value = hexBg;
      document.getElementById("tweakBgVal").textContent = hexBg;
    }

    // Box Model
    if (elem.boxModel) {
      document.getElementById("bmMarginTop").textContent = elem.boxModel.margin.top;
      document.getElementById("bmMarginRight").textContent = elem.boxModel.margin.right;
      document.getElementById("bmMarginBottom").textContent = elem.boxModel.margin.bottom;
      document.getElementById("bmMarginLeft").textContent = elem.boxModel.margin.left;

      document.getElementById("bmBorderTop").textContent = elem.boxModel.border.top;
      document.getElementById("bmBorderRight").textContent = elem.boxModel.border.right;
      document.getElementById("bmBorderBottom").textContent = elem.boxModel.border.bottom;
      document.getElementById("bmBorderLeft").textContent = elem.boxModel.border.left;

      document.getElementById("bmPaddingTop").textContent = elem.boxModel.padding.top;
      document.getElementById("bmPaddingRight").textContent = elem.boxModel.padding.right;
      document.getElementById("bmPaddingBottom").textContent = elem.boxModel.padding.bottom;
      document.getElementById("bmPaddingLeft").textContent = elem.boxModel.padding.left;

      document.getElementById("bmContentDim").textContent = `${elem.boxModel.width} × ${elem.boxModel.height}`;
    }

    // Contrast & Accessibility Ratio
    calculateContrastRatio(elem.styles.color, elem.styles.backgroundColor);

    // Code Exporter
    updateCodeExport(elem);

    // Computed Styles Table
    renderComputedStyles(elem.styles);

    // Outer HTML
    document.getElementById("elemOuterHtml").textContent = elem.outerHTML || "";
  }

  // --- CONTRAST & ACCESSIBILITY CALCULATION ---
  function calculateContrastRatio(fgColor, bgColor) {
    const ratioVal = document.getElementById("contrastRatioVal");
    const aaBadge = document.getElementById("wcagAANormal");
    const aaaBadge = document.getElementById("wcagAAANormal");

    const fgRgb = parseRgb(fgColor);
    const bgRgb = parseRgb(bgColor) || { r: 255, g: 255, b: 255 }; // Default to white if transparent

    if (!fgRgb) {
      ratioVal.textContent = "N/A";
      return;
    }

    const lum1 = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
    const lum2 = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    const ratio = (brightest + 0.05) / (darkest + 0.05);
    const ratioFormatted = ratio.toFixed(2) + ":1";

    ratioVal.textContent = ratioFormatted;

    // WCAG AA requires 4.5:1, AAA requires 7:1
    if (ratio >= 4.5) {
      aaBadge.className = "a11y-pass";
      aaBadge.textContent = "PASS (" + ratio.toFixed(1) + ")";
    } else {
      aaBadge.className = "a11y-fail";
      aaBadge.textContent = "FAIL (" + ratio.toFixed(1) + ")";
    }

    if (ratio >= 7.0) {
      aaaBadge.className = "a11y-pass";
      aaaBadge.textContent = "PASS (" + ratio.toFixed(1) + ")";
    } else {
      aaaBadge.className = "a11y-fail";
      aaaBadge.textContent = "FAIL (" + ratio.toFixed(1) + ")";
    }
  }

  function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function parseRgb(str) {
    if (!str) return null;
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return m ? { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) } : null;
  }

  function rgbToHex(rgbStr) {
    const rgb = parseRgb(rgbStr);
    if (!rgb) return null;
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
  }

  // --- CODE EXPORTERS (Tailwind, CSS, React) ---
  function updateCodeExport(elem) {
    const preview = document.getElementById("exportCodePreview");
    if (!elem || !preview) return;

    if (activeExportTab === "tailwind") {
      const classes = [];
      const s = elem.styles;

      if (s.display === "flex") classes.push("flex");
      if (s.display === "grid") classes.push("grid");
      if (s.display === "block") classes.push("block");
      if (s.display === "none") classes.push("hidden");

      if (s.flexDirection === "column") classes.push("flex-col");
      if (s.justifyContent === "center") classes.push("justify-center");
      if (s.justifyContent === "space-between") classes.push("justify-between");
      if (s.alignItems === "center") classes.push("items-center");

      const hexText = rgbToHex(s.color);
      if (hexText) classes.push(`text-[${hexText}]`);

      const hexBg = rgbToHex(s.backgroundColor);
      if (hexBg) classes.push(`bg-[${hexBg}]`);

      if (s.borderRadius && s.borderRadius !== "0px") classes.push(`rounded-[${s.borderRadius}]`);
      if (s.fontSize) classes.push(`text-[${s.fontSize}]`);
      if (s.fontWeight && s.fontWeight !== "400") classes.push(`font-[${s.fontWeight}]`);
      if (s.padding && s.padding !== "0px") classes.push(`p-[${s.padding.split(" ")[0]}]`);

      preview.textContent = `<${elem.tag} className="${classes.join(" ")}">\n  ${elem.textContent || "..."}\n</${elem.tag}>`;
    } else if (activeExportTab === "css") {
      const s = elem.styles;
      let css = `${elem.selector || elem.tag} {\n`;
      if (s.display) css += `  display: ${s.display};\n`;
      if (s.color) css += `  color: ${s.color};\n`;
      if (s.backgroundColor && s.backgroundColor !== "rgba(0, 0, 0, 0)") css += `  background-color: ${s.backgroundColor};\n`;
      if (s.fontSize) css += `  font-size: ${s.fontSize};\n`;
      if (s.fontFamily) css += `  font-family: ${s.fontFamily};\n`;
      if (s.padding && s.padding !== "0px") css += `  padding: ${s.padding};\n`;
      if (s.borderRadius && s.borderRadius !== "0px") css += `  border-radius: ${s.borderRadius};\n`;
      css += `}`;
      preview.textContent = css;
    } else if (activeExportTab === "react") {
      preview.textContent = `export const ElementComponent = () => {\n  return (\n    <${elem.tag} style={{\n      color: "${elem.styles.color}",\n      backgroundColor: "${elem.styles.backgroundColor}",\n      fontSize: "${elem.styles.fontSize}",\n      borderRadius: "${elem.styles.borderRadius}",\n    }}>\n      ${elem.textContent || "Conteúdo"}\n    </${elem.tag}>\n  );\n};`;
    }
  }

  // Export Tab Buttons
  document.querySelectorAll(".code-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".code-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeExportTab = btn.getAttribute("data-export");
      updateCodeExport(currentElement);
    });
  });

  document.getElementById("copyExportCodeBtn")?.addEventListener("click", () => {
    const text = document.getElementById("exportCodePreview")?.textContent;
    if (text) {
      navigator.clipboard.writeText(text);
      showToast("Código copiado!");
    }
  });

  // --- COMPUTED STYLES TABLE ---
  function renderComputedStyles(styles) {
    const tbody = document.querySelector("#computedStylesTable tbody");
    tbody.innerHTML = "";
    const filter = (document.getElementById("filterStylesInput").value || "").toLowerCase();

    Object.entries(styles).forEach(([prop, val]) => {
      if (!val) return;
      if (filter && !prop.toLowerCase().includes(filter) && !String(val).toLowerCase().includes(filter)) {
        return;
      }
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="style-prop">${prop}</td>
        <td class="style-val">${val}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.getElementById("filterStylesInput").addEventListener("input", () => {
    if (currentElement && currentElement.styles) {
      renderComputedStyles(currentElement.styles);
    }
  });

  // --- LIVE STYLE TWEAKER LISTENERS ---
  function setupStyleTweakers() {
    const colorInput = document.getElementById("tweakColorInput");
    colorInput.addEventListener("input", async (e) => {
      const val = e.target.value;
      document.getElementById("tweakColorVal").textContent = val;
      const res = await sendToContentScript({
        action: "UPDATE_ELEMENT_STYLE",
        property: "color",
        value: val,
      });
      if (res && res.element) {
        currentElement = res.element;
        updateCodeExport(currentElement);
      }
    });

    const bgInput = document.getElementById("tweakBgInput");
    bgInput.addEventListener("input", async (e) => {
      const val = e.target.value;
      document.getElementById("tweakBgVal").textContent = val;
      const res = await sendToContentScript({
        action: "UPDATE_ELEMENT_STYLE",
        property: "backgroundColor",
        value: val,
      });
      if (res && res.element) {
        currentElement = res.element;
        updateCodeExport(currentElement);
      }
    });

    document.getElementById("tweakFontSize").addEventListener("change", async (e) => {
      await sendToContentScript({
        action: "UPDATE_ELEMENT_STYLE",
        property: "fontSize",
        value: e.target.value,
      });
    });

    document.getElementById("tweakBorderRadius").addEventListener("change", async (e) => {
      await sendToContentScript({
        action: "UPDATE_ELEMENT_STYLE",
        property: "borderRadius",
        value: e.target.value,
      });
    });

    document.getElementById("tweakDisplay").addEventListener("change", async (e) => {
      await sendToContentScript({
        action: "UPDATE_ELEMENT_STYLE",
        property: "display",
        value: e.target.value,
      });
    });

    document.getElementById("tweakOpacity").addEventListener("input", async (e) => {
      await sendToContentScript({
        action: "UPDATE_ELEMENT_STYLE",
        property: "opacity",
        value: e.target.value,
      });
    });
  }

  // Deselect Element Handlers
  async function deselectElement() {
    await sendToContentScript({ action: "DESELECT_ELEMENT" });
    currentElement = null;
    if (emptyState) emptyState.style.display = "flex";
    if (elementDetails) elementDetails.style.display = "none";
    showToast("Seleção reiniciada");
  }

  document.getElementById("deselectHeaderBtn")?.addEventListener("click", deselectElement);
  document.getElementById("deselectElemBtn")?.addEventListener("click", deselectElement);
  document.getElementById("deselectElemBtn2")?.addEventListener("click", deselectElement);

  // Global Escape key to deselect / reset
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      deselectElement();
    }
  });

  // --- ELEMENT ACTIONS (Copy, Hide, Scroll, Delete) ---
  document.getElementById("copySelectorBtn")?.addEventListener("click", () => {
    if (currentElement && currentElement.selector) {
      navigator.clipboard.writeText(currentElement.selector);
      showToast("Seletor CSS copiado!");
    }
  });

  document.getElementById("copyXPathBtn")?.addEventListener("click", () => {
    if (currentElement && currentElement.xpath) {
      navigator.clipboard.writeText(currentElement.xpath);
      showToast("XPath copiado!");
    }
  });

  document.getElementById("copyHtmlBtn")?.addEventListener("click", () => {
    if (currentElement && currentElement.outerHTML) {
      navigator.clipboard.writeText(currentElement.outerHTML);
      showToast("HTML copiado!");
    }
  });

  document.getElementById("hideElemBtn")?.addEventListener("click", async () => {
    const res = await sendToContentScript({ action: "HIDE_ELEMENT" });
    if (res && typeof res.isHidden === "boolean") {
      showToast(res.isHidden ? "Elemento ocultado" : "Elemento visível");
    }
  });

  document.getElementById("scrollElemBtn")?.addEventListener("click", async () => {
    await sendToContentScript({ action: "SCROLL_TO_ELEMENT" });
    showToast("Página focada no elemento");
  });

  document.getElementById("deleteElemBtn")?.addEventListener("click", async () => {
    await sendToContentScript({ action: "DELETE_ELEMENT" });
    emptyState.style.display = "flex";
    elementDetails.style.display = "none";
    currentElement = null;
    showToast("Elemento removido do DOM");
  });

  document.getElementById("sendToSandboxBtn")?.addEventListener("click", () => {
    if (currentElement && currentElement.outerHTML) {
      document.getElementById("sandboxCode").value = currentElement.outerHTML;
      switchTab("tab-sandbox");
      runSandbox();
      showToast("HTML carregado no Sandbox!");
    }
  });

  // --- 3-MODE SCREEN CAPTURE ---
  const captureTabBtn = document.getElementById("captureTabBtn");
  const captureAreaBtn = document.getElementById("captureAreaBtn");
  const captureSectionBtn = document.getElementById("captureSectionBtn");
  const capturePreviewContainer = document.getElementById("capturePreviewContainer");
  const capturePreviewImg = document.getElementById("capturePreviewImg");
  const captureMetaText = document.getElementById("captureMetaText");
  const downloadCaptureLink = document.getElementById("downloadCaptureLink");
  const copyCaptureBtn = document.getElementById("copyCaptureBtn");
  const clearCaptureBtn = document.getElementById("clearCaptureBtn");

  function displayCapturePreview(dataUrl, meta) {
    capturePreviewImg.src = dataUrl;
    captureMetaText.textContent = meta || "PNG • Resolução Nativa";
    downloadCaptureLink.href = dataUrl;
    downloadCaptureLink.download = `edge-capture-${Date.now()}.png`;
    capturePreviewContainer.style.display = "block";
  }

  // Clear / Remove Captured Image
  clearCaptureBtn?.addEventListener("click", () => {
    capturePreviewImg.src = "";
    capturePreviewContainer.style.display = "none";
    showToast("Captura de imagem removida");
  });

  // Mode 1: Visible Tab
  captureTabBtn?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "CAPTURE_VISIBLE_TAB" }, (res) => {
      if (res && res.dataUrl) {
        displayCapturePreview(res.dataUrl, "Janela Completa • PNG");
        showToast("Janela capturada!");
      } else {
        showToast("Falha na captura da página");
      }
    });
  });

  // Mode 2: Custom Area Selection
  captureAreaBtn?.addEventListener("click", async () => {
    showToast("Selecione a área na página (Esc p/ cancelar)");
    await sendToContentScript({ action: "START_AREA_SELECTION" });
  });

  // Mode 3: Container Section / Div Capture
  captureSectionBtn?.addEventListener("click", async () => {
    showToast("Capturando section/div do elemento...");
    const res = await sendToContentScript({ action: "CAPTURE_SECTION_IMAGE" });
    if (res && res.dataUrl) {
      displayCapturePreview(res.dataUrl, `Container <${res.tag || "section"}> • ${res.width} × ${res.height} px`);
      showToast(`Section/Div <${res.tag || "div"}> capturada com sucesso!`);
    } else {
      showToast("Falha ao capturar container section/div");
    }
  });

  // Copy captured screenshot to system clipboard
  copyCaptureBtn?.addEventListener("click", async () => {
    if (!capturePreviewImg.src) return;
    try {
      const response = await fetch(capturePreviewImg.src);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      showToast("Imagem copiada para a área de transferência!");
    } catch (e) {
      showToast("Erro ao copiar imagem");
    }
  });

  // --- ASSETS SCANNER (Colors, Fonts, Headings, Images) ---
  async function loadPageAssets() {
    const res = await sendToContentScript({ action: "GET_PAGE_ASSETS" });
    if (!res || !res.assets) return;

    const assets = res.assets;

    // Colors
    const colorGrid = document.getElementById("colorPaletteGrid");
    colorGrid.innerHTML = "";
    document.getElementById("colorCount").textContent = assets.colors.length;

    assets.colors.forEach((color) => {
      const hex = rgbToHex(color) || color;
      const chip = document.createElement("div");
      chip.className = "color-chip";
      chip.title = `Clique para copiar ${hex}`;
      chip.innerHTML = `
        <div class="color-sample" style="background-color: ${color};"></div>
        <span class="color-code">${hex}</span>
      `;
      chip.addEventListener("click", () => {
        navigator.clipboard.writeText(hex);
        showToast(`Cor copiada: ${hex}`);
      });
      colorGrid.appendChild(chip);
    });

    // Fonts
    const fontsList = document.getElementById("fontsList");
    fontsList.innerHTML = "";
    document.getElementById("fontCount").textContent = assets.fonts.length;

    assets.fonts.forEach((font) => {
      const item = document.createElement("div");
      item.className = "font-item";
      item.innerHTML = `
        <span style="font-family: ${font}; font-size: 11px;">${font}</span>
        <button class="btn-xs" data-font="${font}">Copiar</button>
      `;
      item.querySelector("button").addEventListener("click", () => {
        navigator.clipboard.writeText(font);
        showToast(`Fonte copiada: ${font}`);
      });
      fontsList.appendChild(item);
    });

    // Headings
    const headingsList = document.getElementById("headingsList");
    headingsList.innerHTML = "";
    document.getElementById("headingsCount").textContent = assets.headings.length;

    assets.headings.forEach((h) => {
      const item = document.createElement("div");
      item.className = "heading-item";
      item.innerHTML = `
        <span class="tag-badge" style="font-size: 10px;">${h.tag.toUpperCase()}</span>
        <span style="flex: 1; margin: 0 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${h.text || "(vazio)"}</span>
        <button class="btn-xs">Ver</button>
      `;
      item.querySelector("button").addEventListener("click", async () => {
        await sendToContentScript({ action: "SELECT_BY_SELECTOR", selector: h.selector });
        switchTab("tab-element");
      });
      headingsList.appendChild(item);
    });

    // Images
    const imagesGrid = document.getElementById("imagesGrid");
    imagesGrid.innerHTML = "";
    document.getElementById("imageCount").textContent = assets.images.length;

    // Image Downloader Helper
    async function triggerImageDownload(url, defaultName = "imagem.png") {
      try {
        showToast("Baixando imagem...");
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;

        let filename = defaultName;
        try {
          const urlObj = new URL(url);
          const parts = urlObj.pathname.split("/").filter(Boolean);
          if (parts.length > 0) {
            const last = parts[parts.length - 1];
            if (last.includes(".")) filename = last;
            else filename = `${last}.png`;
          }
        } catch (e) {}

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        showToast(`Imagem "${filename}" baixada!`);
      } catch (err) {
        // Fallback for CORS or direct link
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.download = defaultName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("Download iniciado!");
      }
    }

    assets.images.forEach((img, idx) => {
      const card = document.createElement("div");
      card.className = "image-card";
      card.innerHTML = `
        <img class="image-preview" src="${img.src}" alt="${img.alt}">
        <span class="image-dim">${img.width} × ${img.height} px</span>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin-top: 3px;">
          <button class="btn-xs download-btn" style="background: #1e3a8a; color: #93c5fd; border: 1px solid #1d4ed8; display: flex; align-items: center; justify-content: center; gap: 2px;" title="Baixar imagem no computador">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Baixar
          </button>
          <button class="btn-xs copy-btn" title="Copiar URL da imagem">
            Copiar
          </button>
        </div>
      `;

      card.querySelector(".download-btn").addEventListener("click", () => {
        triggerImageDownload(img.src, `asset-image-${idx + 1}.png`);
      });

      card.querySelector(".copy-btn").addEventListener("click", () => {
        navigator.clipboard.writeText(img.src);
        showToast("URL da imagem copiada!");
      });

      imagesGrid.appendChild(card);
    });

    // Wire Batch Download All Images
    const downloadAllBtn = document.getElementById("downloadAllImagesBtn");
    if (downloadAllBtn) {
      // Remove old listeners by replacing clone or resetting onclick
      downloadAllBtn.onclick = async () => {
        if (!assets.images || assets.images.length === 0) {
          showToast("Nenhuma imagem disponível para download.");
          return;
        }
        showToast(`Iniciando download de ${assets.images.length} imagem(ns)...`);
        for (let i = 0; i < assets.images.length; i++) {
          const item = assets.images[i];
          await triggerImageDownload(item.src, `asset-${i + 1}.png`);
          await new Promise((r) => setTimeout(r, 350));
        }
        showToast("Todas as imagens foram baixadas!");
      };
    }
  }

  document.getElementById("reloadAssetsBtn")?.addEventListener("click", loadPageAssets);

  // --- ADVANCED TOOLS (Diagnostics, Grid Outlines, Storage) ---
  document.getElementById("toggleGridOutlines")?.addEventListener("change", async () => {
    const res = await sendToContentScript({ action: "TOGGLE_GRID_OUTLINES" });
    showToast(res.enabled ? "Linhas de contorno ativadas" : "Linhas de contorno desativadas");
  });

  document.getElementById("toggleBaselineGrid")?.addEventListener("change", async () => {
    const res = await sendToContentScript({ action: "TOGGLE_BASELINE_GRID" });
    showToast(res.enabled ? "Grade base ativada" : "Grade base desativada");
  });

  async function loadPageDiagnostics() {
    const res = await sendToContentScript({ action: "GET_PAGE_DIAGNOSTICS" });
    if (!res || !res.diagnostics) return;

    const diag = res.diagnostics;
    const tbody = document.querySelector("#diagTable tbody");
    tbody.innerHTML = `
      <tr><td class="style-prop">Total de Elementos DOM</td><td class="style-val">${diag.totalElements} nós</td></tr>
      <tr><td class="style-prop">Profundidade Máxima DOM</td><td class="style-val">${diag.maxDomDepth} níveis</td></tr>
      <tr><td class="style-prop">Scripts Carregados</td><td class="style-val">${diag.scriptsCount} tags</td></tr>
      <tr><td class="style-prop">Folhas de Estilo (CSS)</td><td class="style-val">${diag.stylesheetsCount} arquivos</td></tr>
      <tr><td class="style-prop">Tempo de Carregamento</td><td class="style-val">${diag.loadTime}</td></tr>
      <tr><td class="style-prop">Doctype / Charset</td><td class="style-val">${diag.doctype} • ${diag.charset}</td></tr>
    `;
  }
  document.getElementById("refreshDiagBtn")?.addEventListener("click", loadPageDiagnostics);

  async function loadSiteStorage() {
    const res = await sendToContentScript({ action: "GET_SITE_STORAGE" });
    if (!res || !res.storage) return;

    const s = res.storage;
    const tbody = document.querySelector("#storageTable tbody");
    tbody.innerHTML = "";

    // LocalStorage keys
    Object.entries(s.localStorage).forEach(([k, v]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="style-prop">local: ${k}</td><td class="style-val">${v}</td>`;
      tbody.appendChild(tr);
    });

    // Cookies
    s.cookies.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="style-prop" style="color: #f59e0b;">cookie: ${c.name}</td><td class="style-val">${c.value}</td>`;
      tbody.appendChild(tr);
    });

    if (tbody.children.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="color: var(--text-muted); text-align: center; padding: 8px;">Nenhum item armazenado encontrado neste domínio.</td></tr>`;
    }
  }
  document.getElementById("refreshStorageBtn")?.addEventListener("click", loadSiteStorage);

  // --- SANDBOX RUNNER ---
  function runSandbox() {
    const code = document.getElementById("sandboxCode").value;
    const frame = document.getElementById("sandboxFrame");
    frame.srcdoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; padding: 12px; margin: 0; background: #ffffff; color: #18181b; }
          </style>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
  }

  document.getElementById("runSandboxBtn")?.addEventListener("click", runSandbox);

  // --- CUSTOM CSS LIVE INJECTION SUITE (Per-Site Persistence & Live Debounce Preview) ---
  let customCssDebounceTimer = null;
  const customCssCode = document.getElementById("customCssCode");
  const cssLineNumbers = document.getElementById("cssLineNumbers");
  const toggleCustomCss = document.getElementById("toggleCustomCss");
  const forceImportantToggle = document.getElementById("forceImportantToggle");
  const cssLengthCounter = document.getElementById("cssLengthCounter");
  const cssDebounceStatus = document.getElementById("cssDebounceStatus");
  const customCssHostname = document.getElementById("customCssHostname");

  function updateCustomCssSite(hostname) {
    if (customCssHostname) {
      customCssHostname.textContent = hostname || "local";
    }
  }

  // Update line numbers and length count in editor
  function updateEditorLineNumbers() {
    if (!customCssCode || !cssLineNumbers) return;
    const lines = customCssCode.value.split("\n").length || 1;
    let numbersText = "";
    for (let i = 1; i <= lines; i++) {
      numbersText += i + "\n";
    }
    cssLineNumbers.textContent = numbersText;
    if (cssLengthCounter) {
      cssLengthCounter.textContent = `${customCssCode.value.length} caracteres • ${lines} linhas`;
    }
  }

  // Load site custom CSS from chrome.storage.local
  function loadSiteCustomCss(hostname) {
    if (!hostname) return;
    chrome.storage.local.get([`edge_css_${hostname}`], (result) => {
      const data = result[`edge_css_${hostname}`];
      if (customCssCode) {
        if (data && typeof data.css === "string") {
          customCssCode.value = data.css;
        } else {
          customCssCode.value = "";
        }
        updateEditorLineNumbers();
      }
      if (toggleCustomCss && data && typeof data.enabled === "boolean") {
        toggleCustomCss.checked = data.enabled;
      }

      // Auto apply to page if content is available
      const enabled = toggleCustomCss ? toggleCustomCss.checked : true;
      const cssToApply = customCssCode ? customCssCode.value : (data ? data.css : "");
      sendToContentScript({
        action: "APPLY_CUSTOM_CSS",
        css: cssToApply,
        enabled: enabled,
      });
    });
  }

  // Save site custom CSS to chrome.storage.local
  function saveSiteCustomCss(hostname, css, enabled) {
    if (!hostname) return;
    chrome.storage.local.set({
      [`edge_css_${hostname}`]: {
        css: css || "",
        enabled: enabled !== false,
        updatedAt: Date.now(),
      },
    });
  }

  // Live CSS Trigger with Debounce (~120ms)
  function triggerLiveCssUpdate() {
    if (cssDebounceStatus) {
      cssDebounceStatus.textContent = "Sincronizando...";
      cssDebounceStatus.style.color = "#f59e0b";
    }

    if (customCssDebounceTimer) clearTimeout(customCssDebounceTimer);

    customCssDebounceTimer = setTimeout(async () => {
      let rawCss = customCssCode ? customCssCode.value : "";
      const isEnabled = toggleCustomCss ? toggleCustomCss.checked : true;

      // Save to chrome.storage.local for per-domain isolation
      saveSiteCustomCss(currentHostname, rawCss, isEnabled);

      // Send to page content script for immediate DOM style tag update
      const res = await sendToContentScript({
        action: "APPLY_CUSTOM_CSS",
        css: rawCss,
        enabled: isEnabled,
      });

      if (cssDebounceStatus) {
        if (res && res.applied) {
          cssDebounceStatus.textContent = "Sincronizado";
          cssDebounceStatus.style.color = "#22c55e";
        } else if (res && !res.applied) {
          cssDebounceStatus.textContent = isEnabled ? "Vazio" : "Desativado";
          cssDebounceStatus.style.color = "#a1a1aa";
        } else {
          cssDebounceStatus.textContent = "Erro na página";
          cssDebounceStatus.style.color = "#ef4444";
        }
      }
    }, 120);
  }

  // Snippets Definitions
  const CSS_SNIPPETS = {
    darkmode: `/* 🌙 Dark Mode Universal */
html, body {
  background-color: #0d1117 !important;
  color: #c9d1d9 !important;
}
div, section, article, nav, header, main, footer {
  background-color: #161b22 !important;
  color: #c9d1d9 !important;
  border-color: #30363d !important;
}
a {
  color: #58a6ff !important;
}
p, span, h1, h2, h3, h4, h5, h6 {
  color: #f0f6fc !important;
}`,
    hideads: `/* 🚫 Ocultar Banners e Anúncios */
iframe[src*="ads"],
[class*="banner"],
[class*="ad-"],
[id*="google_ads"],
[class*="cookie-banner"],
[class*="popup-modal"] {
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}`,
    modernfont: `/* 🔤 Tipografia Moderna */
* {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif !important;
  letter-spacing: -0.01em !important;
}
h1, h2, h3 {
  letter-spacing: -0.03em !important;
  font-weight: 700 !important;
}`,
    accentcolor: `/* 🎨 Paleta de Destaque Cyan */
:root {
  --primary-accent: #06b6d4 !important;
}
button, a.btn, .button, input[type="submit"] {
  background-color: #06b6d4 !important;
  color: #000000 !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
}`,
    glassmorphism: `/* ✨ Efeito Glassmorphism */
header, nav, .navbar, .top-bar {
  background: rgba(15, 23, 42, 0.75) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}`,
    smoothscroll: `/* 🌊 Scroll Suave */
html {
  scroll-behavior: smooth !important;
}
::selection {
  background: #06b6d4 !important;
  color: #000000 !important;
}`
  };

  function setupCustomCssListeners() {
    if (customCssCode) {
      customCssCode.addEventListener("input", () => {
        updateEditorLineNumbers();
        triggerLiveCssUpdate();
      });

      customCssCode.addEventListener("scroll", () => {
        if (cssLineNumbers) {
          cssLineNumbers.scrollTop = customCssCode.scrollTop;
        }
      });

      // Handle Tab key in CSS Editor
      customCssCode.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          const start = customCssCode.selectionStart;
          const end = customCssCode.selectionEnd;
          customCssCode.value = customCssCode.value.substring(0, start) + "  " + customCssCode.value.substring(end);
          customCssCode.selectionStart = customCssCode.selectionEnd = start + 2;
          updateEditorLineNumbers();
          triggerLiveCssUpdate();
        }
      });
    }

    toggleCustomCss?.addEventListener("change", () => {
      triggerLiveCssUpdate();
      showToast(toggleCustomCss.checked ? "CSS Injetado Ativado" : "CSS Injetado Desativado");
    });

    forceImportantToggle?.addEventListener("change", () => {
      if (!customCssCode || !customCssCode.value) return;
      if (forceImportantToggle.checked) {
        // Append !important to declarations that don't have it
        customCssCode.value = customCssCode.value.replace(/([^;{}]+:[^;{}!]+)(;|\n)/g, "$1 !important$2");
        showToast("!important adicionado às regras");
      } else {
        // Strip !important
        customCssCode.value = customCssCode.value.replace(/\s*!important/g, "");
        showToast("!important removido das regras");
      }
      updateEditorLineNumbers();
      triggerLiveCssUpdate();
    });

    // Snippets Chips click
    document.querySelectorAll(".snippet-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const type = chip.getAttribute("data-snippet");
        const snippet = CSS_SNIPPETS[type];
        if (snippet && customCssCode) {
          const current = customCssCode.value.trim();
          customCssCode.value = current ? `${current}\n\n${snippet}` : snippet;
          updateEditorLineNumbers();
          triggerLiveCssUpdate();
          showToast(`Snippet "${chip.textContent.trim()}" inserido!`);
        }
      });
    });

    // Format CSS
    document.getElementById("formatCssBtn")?.addEventListener("click", () => {
      if (!customCssCode || !customCssCode.value) return;
      try {
        let formatted = customCssCode.value
          .replace(/\s*{\s*/g, " {\n  ")
          .replace(/;\s*/g, ";\n  ")
          .replace(/\s*}\s*/g, "\n}\n\n")
          .trim();
        customCssCode.value = formatted;
        updateEditorLineNumbers();
        triggerLiveCssUpdate();
        showToast("CSS formatado!");
      } catch (e) {
        showToast("Erro ao formatar");
      }
    });

    // Clear CSS
    document.getElementById("clearCustomCssBtn")?.addEventListener("click", () => {
      if (confirm(`Deseja limpar todo o CSS customizado para ${currentHostname}?`)) {
        if (customCssCode) customCssCode.value = "";
        updateEditorLineNumbers();
        triggerLiveCssUpdate();
        showToast("CSS limpo");
      }
    });

    // Copy Custom CSS
    document.getElementById("copyCustomCssBtn")?.addEventListener("click", () => {
      if (!customCssCode || !customCssCode.value.trim()) {
        showToast("Nenhum CSS para copiar");
        return;
      }
      navigator.clipboard.writeText(customCssCode.value);
      showToast("CSS copiado para a área de transferência!");
    });

    // Download .css file
    document.getElementById("downloadCustomCssBtn")?.addEventListener("click", () => {
      const css = customCssCode ? customCssCode.value : "";
      if (!css.trim()) {
        showToast("Nenhum CSS para exportar");
        return;
      }
      const blob = new Blob([css], { type: "text/css;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `custom-${currentHostname || "styles"}.css`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Arquivo "custom-${currentHostname}.css" exportado!`);
    });
  }

  // --- VISUAL BUILDER & CONTENT EDIT SUITE ---
  function setupVisualBuilder() {
    const toggleEditContentBtn = document.getElementById("toggleEditContentBtn");
    const editContentBtnText = document.getElementById("editContentBtnText");
    const contentEditStatusBadge = document.getElementById("contentEditStatusBadge");
    const duplicateElemBtn = document.getElementById("duplicateElemBtn");
    const moveElemUpBtn = document.getElementById("moveElemUpBtn");
    const moveElemDownBtn = document.getElementById("moveElemDownBtn");
    const replaceImageBtn = document.getElementById("replaceImageBtn");
    const imageReplacerPanel = document.getElementById("imageReplacerPanel");
    const closeImageReplacerBtn = document.getElementById("closeImageReplacerBtn");
    const imageReplacerUrlInput = document.getElementById("imageReplacerUrlInput");
    const imageReplacerFileInput = document.getElementById("imageReplacerFileInput");
    const applyImageUrlBtn = document.getElementById("applyImageUrlBtn");
    const quickMockupScreenshotBtn = document.getElementById("quickMockupScreenshotBtn");
    const toggleGlobalDesignMode = document.getElementById("toggleGlobalDesignMode");

    // Toggle ContentEditable on Selected Element
    toggleEditContentBtn?.addEventListener("click", async () => {
      const res = await sendToContentScript({ action: "TOGGLE_CONTENT_EDITABLE" });
      if (res && res.success) {
        if (res.isEditing) {
          toggleEditContentBtn.classList.add("active");
          if (editContentBtnText) editContentBtnText.textContent = "Concluir Edição";
          if (contentEditStatusBadge) contentEditStatusBadge.style.display = "inline-block";
          showToast("✏️ Clique no texto na página para digitar livremente!");
        } else {
          toggleEditContentBtn.classList.remove("active");
          if (editContentBtnText) editContentBtnText.textContent = "Editar Texto";
          if (contentEditStatusBadge) contentEditStatusBadge.style.display = "none";
          showToast("Edição de texto concluída");
        }
      } else if (res && res.error) {
        showToast(res.error);
      }
    });

    // Duplicate Element
    duplicateElemBtn?.addEventListener("click", async () => {
      const res = await sendToContentScript({ action: "DUPLICATE_ELEMENT" });
      if (res && res.success) {
        showToast("Elemento duplicado com sucesso!");
      } else if (res && res.error) {
        showToast(res.error);
      }
    });

    // Move Element Up / Down
    moveElemUpBtn?.addEventListener("click", async () => {
      const res = await sendToContentScript({ action: "MOVE_ELEMENT", direction: "up" });
      if (res && res.success) {
        showToast("Elemento movido para cima");
      } else if (res && res.error) {
        showToast(res.error);
      }
    });

    moveElemDownBtn?.addEventListener("click", async () => {
      const res = await sendToContentScript({ action: "MOVE_ELEMENT", direction: "down" });
      if (res && res.success) {
        showToast("Elemento movido para baixo");
      } else if (res && res.error) {
        showToast(res.error);
      }
    });

    // Image Replacer Panel
    replaceImageBtn?.addEventListener("click", () => {
      if (imageReplacerPanel) {
        const isShown = imageReplacerPanel.style.display !== "none";
        imageReplacerPanel.style.display = isShown ? "none" : "block";
      }
    });

    closeImageReplacerBtn?.addEventListener("click", () => {
      if (imageReplacerPanel) imageReplacerPanel.style.display = "none";
    });

    applyImageUrlBtn?.addEventListener("click", async () => {
      const url = (imageReplacerUrlInput?.value || "").trim();
      if (!url) {
        showToast("Digite uma URL de imagem");
        return;
      }
      const res = await sendToContentScript({ action: "REPLACE_ELEMENT_IMAGE", src: url });
      if (res && res.success) {
        showToast("Imagem substituída!");
        if (imageReplacerPanel) imageReplacerPanel.style.display = "none";
        if (res.element) {
          currentElement = res.element;
          renderElementDetails(currentElement, false);
        }
      } else if (res && res.error) {
        showToast(res.error);
      }
    });

    imageReplacerFileInput?.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        const res = await sendToContentScript({ action: "REPLACE_ELEMENT_IMAGE", src: dataUrl });
        if (res && res.success) {
          showToast("Imagem carregada do computador e aplicada!");
          if (imageReplacerPanel) imageReplacerPanel.style.display = "none";
          if (res.element) {
            currentElement = res.element;
            renderElementDetails(currentElement, false);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    // Quick Mockup Screenshot
    quickMockupScreenshotBtn?.addEventListener("click", async () => {
      showToast("Capturando mockup em alta resolução...");
      const res = await sendToContentScript({ action: "CAPTURE_SECTION_IMAGE" });
      if (res && res.dataUrl) {
        displayCapturePreview(res.dataUrl, `Mockup Container • ${res.width} × ${res.height} px`);
        switchTab("tab-capture");
        showToast("Mockup capturado!");
      } else {
        // Fallback to visible tab capture
        chrome.runtime.sendMessage({ action: "CAPTURE_VISIBLE_TAB" }, (r) => {
          if (r && r.dataUrl) {
            displayCapturePreview(r.dataUrl, "Mockup de Tela • PNG");
            switchTab("tab-capture");
            showToast("Mockup da página capturado!");
          }
        });
      }
    });

    // Global Design Mode Toggle in Tab Tools
    toggleGlobalDesignMode?.addEventListener("change", async () => {
      const res = await sendToContentScript({ action: "TOGGLE_DESIGN_MODE" });
      if (res && typeof res.isDesignMode === "boolean") {
        showToast(res.isDesignMode ? "Modo Design Global Ativado" : "Modo Design Global Desativado");
      }
    });
  }

  // Port connection to Background worker to detect side panel closure and clean up web page
  let sidepanelPort = null;
  try {
    sidepanelPort = chrome.runtime.connect({ name: "edge_sidepanel_port" });
  } catch (e) {
    console.warn("Could not create sidepanel port:", e);
  }

  function handleSidepanelClose() {
    sendToContentScript({ action: "CLEANUP_ALL_INSPECTOR" });
    try {
      chrome.runtime.sendMessage({ action: "SIDEPANEL_CLOSED" });
    } catch (e) {}
  }

  window.addEventListener("beforeunload", handleSidepanelClose);
  window.addEventListener("pagehide", handleSidepanelClose);
  window.addEventListener("unload", handleSidepanelClose);

  // Initialize
  inspectBtn?.addEventListener("click", toggleInspect);
  emptyInspectBtn?.addEventListener("click", toggleInspect);
  refreshBtn?.addEventListener("click", syncActiveTab);

  setupStyleTweakers();
  setupCustomCssListeners();
  setupVisualBuilder();
  syncActiveTab();

  console.log("Edge Web Inspector Side Panel v2.0 initialized.");
})();

