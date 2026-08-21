/**
 * Edge Web Inspector - Content Script v2.0
 * Provides DOM Inspection, Area/Element/Full-page screenshots, Storage Reader,
 * Grid/Outline debuggers, and accessibility metrics.
 */

(function () {
  if (window.__edgeInspectorInjected) return;
  window.__edgeInspectorInjected = true;

  let isInspectMode = false;
  let isAreaSelectMode = false;
  let hoveredElement = null;
  let selectedElement = null;
  let overlayEl = null;
  let badgeEl = null;
  let tempHighlightEl = null;

  // Area Selection Variables
  let areaOverlay = null;
  let areaBox = null;
  let areaDim = null;
  let startX = 0;
  let startY = 0;
  let isDraggingArea = false;

  // Initialize Overlays
  function createOverlays() {
    if (overlayEl && badgeEl && document.documentElement.contains(overlayEl) && document.documentElement.contains(badgeEl)) {
      return;
    }

    if (!overlayEl || !document.documentElement.contains(overlayEl)) {
      if (overlayEl && overlayEl.parentNode) overlayEl.remove();
      overlayEl = document.createElement("div");
      overlayEl.className = "__edge_inspector_overlay";
      overlayEl.style.display = "none";
      document.documentElement.appendChild(overlayEl);
    }

    if (!badgeEl || !document.documentElement.contains(badgeEl)) {
      if (badgeEl && badgeEl.parentNode) badgeEl.remove();
      badgeEl = document.createElement("div");
      badgeEl.className = "__edge_inspector_badge";
      badgeEl.style.display = "none";
      document.documentElement.appendChild(badgeEl);
    }
  }

  function getUniqueSelector(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return "";
    if (el.id) {
      const idSelector = `#${CSS.escape(el.id)}`;
      if (document.querySelectorAll(idSelector).length === 1) return idSelector;
    }

    const path = [];
    let current = el;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.documentElement) {
      let selector = current.nodeName.toLowerCase();
      if (current.id) {
        selector += `#${CSS.escape(current.id)}`;
        path.unshift(selector);
        break;
      } else {
        let sibling = current;
        let nth = 1;
        while ((sibling = sibling.previousElementSibling)) {
          if (sibling.nodeName.toLowerCase() === selector) nth++;
        }
        if (nth > 1) selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(" > ");
  }

  function getXPath(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return "";
    if (el.id) return `//*[@id="${el.id}"]`;

    const segments = [];
    for (; el && el.nodeType === Node.ELEMENT_NODE; el = el.parentNode) {
      if (el.id) {
        segments.unshift(`*[@id="${el.id}"]`);
        return "//" + segments.join("/");
      }
      let count = 1;
      let sibling = el.previousSibling;
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === el.nodeName) {
          count++;
        }
        sibling = sibling.previousSibling;
      }
      const tagName = el.nodeName.toLowerCase();
      segments.unshift(count > 1 ? `${tagName}[${count}]` : tagName);
    }
    return "/" + segments.join("/");
  }

  function getBoxModel(computedStyle, rect) {
    const parse = (val) => parseFloat(val) || 0;
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      margin: {
        top: parse(computedStyle.marginTop),
        right: parse(computedStyle.marginRight),
        bottom: parse(computedStyle.marginBottom),
        left: parse(computedStyle.marginLeft),
      },
      padding: {
        top: parse(computedStyle.paddingTop),
        right: parse(computedStyle.paddingRight),
        bottom: parse(computedStyle.paddingBottom),
        left: parse(computedStyle.paddingLeft),
      },
      border: {
        top: parse(computedStyle.borderTopWidth),
        right: parse(computedStyle.borderRightWidth),
        bottom: parse(computedStyle.borderBottomWidth),
        left: parse(computedStyle.borderLeftWidth),
      },
    };
  }

  function getDOMHierarchy(el) {
    const list = [];
    let curr = el;
    while (curr && curr.nodeType === Node.ELEMENT_NODE) {
      list.unshift({
        tag: curr.nodeName.toLowerCase(),
        id: curr.id || "",
        className: typeof curr.className === "string" ? curr.className : "",
        selector: getUniqueSelector(curr),
      });
      if (curr === document.body) break;
      curr = curr.parentElement;
    }
    return list;
  }

  function extractElementData(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return null;

    const computed = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const classes = Array.from(el.classList || []);
    const attributes = {};

    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      attributes[attr.name] = attr.value;
    }

    const styles = {
      display: computed.display,
      position: computed.position,
      flexDirection: computed.flexDirection,
      justifyContent: computed.justifyContent,
      alignItems: computed.alignItems,
      gap: computed.gap,
      gridTemplateColumns: computed.gridTemplateColumns,

      color: computed.color,
      backgroundColor: computed.backgroundColor,
      backgroundImage: computed.backgroundImage,
      borderColor: computed.borderColor,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      opacity: computed.opacity,

      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      lineHeight: computed.lineHeight,
      letterSpacing: computed.letterSpacing,
      textAlign: computed.textAlign,
      textDecoration: computed.textDecorationLine,

      margin: computed.margin,
      padding: computed.padding,
      width: computed.width,
      height: computed.height,
      zIndex: computed.zIndex,
      cursor: computed.cursor,
      visibility: computed.visibility,
    };

    return {
      tag: el.nodeName.toLowerCase(),
      id: el.id || "",
      classes: classes,
      attributes: attributes,
      rect: {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      boxModel: getBoxModel(computed, rect),
      styles: styles,
      outerHTML: el.outerHTML,
      innerHTML: el.innerHTML,
      textContent: (el.textContent || "").trim().slice(0, 500),
      selector: getUniqueSelector(el),
      xpath: getXPath(el),
      hierarchy: getDOMHierarchy(el),
      pageTitle: document.title,
      pageUrl: window.location.href,
      hostname: window.location.hostname,
    };
  }

  // Get computed ARIA role of element
  function getAriaRole(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return "generic";
    const explicitRole = el.getAttribute("role");
    if (explicitRole) return explicitRole;

    const tag = el.nodeName.toLowerCase();
    switch (tag) {
      case "a": return el.hasAttribute("href") ? "link" : "generic";
      case "button": return "button";
      case "p": return "paragraph";
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": return "heading";
      case "input": {
        const type = (el.getAttribute("type") || "text").toLowerCase();
        if (type === "button" || type === "submit" || type === "reset") return "button";
        if (type === "checkbox") return "checkbox";
        if (type === "radio") return "radio";
        return "textbox";
      }
      case "textarea": return "textbox";
      case "select": return "combobox";
      case "ul":
      case "ol": return "list";
      case "li": return "listitem";
      case "img": return "img";
      case "nav": return "navigation";
      case "main": return "main";
      case "section": return "region";
      case "header": return "banner";
      case "footer": return "contentinfo";
      case "table": return "table";
      case "dialog": return "dialog";
      case "form": return "form";
      default: return "generic";
    }
  }

  // Check if element is keyboard focusable
  function isKeyboardFocusable(el) {
    if (!el) return false;
    const tabIndex = el.getAttribute("tabindex");
    if (tabIndex !== null && !isNaN(parseInt(tabIndex, 10)) && parseInt(tabIndex, 10) >= 0) {
      return true;
    }
    const tag = el.nodeName.toLowerCase();
    if (tag === "a" && el.hasAttribute("href")) return true;
    if (["button", "select", "textarea"].includes(tag) && !el.disabled) return true;
    if (tag === "input" && el.type !== "hidden" && !el.disabled) return true;
    return false;
  }

  // Helper to convert rgb to hex for color swatch
  function rgbToHexStr(rgb) {
    if (!rgb || rgb === "transparent" || rgb.includes("0, 0, 0, 0")) return null;
    const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return rgb;
    const hex = (x) => parseInt(x, 10).toString(16).padStart(2, "0");
    return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
  }

  // Find nearest structural container (section, article, main, div)
  function findNearestContainer(el) {
    if (!el) return null;
    let curr = el;

    // If starting element is already a major section/container with meaningful size
    const majorTags = ["section", "article", "main", "header", "footer", "nav", "aside"];
    if (majorTags.includes(curr.nodeName.toLowerCase())) {
      return curr;
    }

    // Traverse upwards to find nearest semantic container or section/card div
    while (curr && curr !== document.body && curr !== document.documentElement) {
      const tag = curr.nodeName.toLowerCase();
      if (majorTags.includes(tag)) {
        return curr;
      }
      
      const className = typeof curr.className === "string" ? curr.className.toLowerCase() : "";
      if (
        className.includes("section") ||
        className.includes("container") ||
        className.includes("wrapper") ||
        className.includes("card") ||
        className.includes("box") ||
        className.includes("grid") ||
        className.includes("layout") ||
        className.includes("hero")
      ) {
        const r = curr.getBoundingClientRect();
        if (r.width > 50 && r.height > 50) {
          return curr;
        }
      }

      // If curr is a div with substantial area compared to child
      if (tag === "div") {
        const r = curr.getBoundingClientRect();
        if (r.width >= 120 && r.height >= 60) {
          return curr;
        }
      }

      curr = curr.parentElement;
    }

    return el.closest("div") || el;
  }

  function updateOverlayPosition(el) {
    if (!overlayEl || !badgeEl || !el) {
      if (overlayEl) overlayEl.className = "__edge_inspector_overlay";
      if (badgeEl) badgeEl.style.display = "none";
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    overlayEl.style.top = `${rect.top}px`;
    overlayEl.style.left = `${rect.left}px`;
    overlayEl.style.width = `${rect.width}px`;
    overlayEl.style.height = `${rect.height}px`;
    overlayEl.className = "__edge_inspector_overlay __active";

    const tag = el.nodeName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const classes = el.className && typeof el.className === "string" 
      ? "." + el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join(".") 
      : "";
    
    // Precise Google DevTools dimensions (e.g. 364.8 × 42)
    const widthRounded = Math.round(rect.width * 10) / 10;
    const heightRounded = Math.round(rect.height * 10) / 10;
    const dims = `${widthRounded} × ${heightRounded}`;

    const computed = window.getComputedStyle(el);
    const role = getAriaRole(el);
    const focusable = isKeyboardFocusable(el);
    const nameText = el.getAttribute("aria-label") || el.getAttribute("alt") || el.getAttribute("title") || (el.innerText || "").trim().slice(0, 26);
    
    const colorHex = rgbToHexStr(computed.color);
    const fontSize = computed.fontSize;
    const primaryFont = (computed.fontFamily || "").split(",")[0].replace(/['"]/g, "").trim();

    // Google DevTools Inspect Popup HTML (1:1 with Chrome/Edge inspector)
    let html = `
      <div class="__edge_devtools_header">
        <div class="__edge_devtools_selector">
          <span class="__edge_inspector_tag">${tag}</span>
          ${classes ? `<span class="__edge_inspector_classes">${classes}</span>` : ""}
          ${id ? `<span class="__edge_inspector_id">${id}</span>` : ""}
        </div>
        <span class="__edge_devtools_dims">${dims}</span>
      </div>
    `;

    // Style properties row if relevant (Color, Font)
    const hasStyles = colorHex || (fontSize && primaryFont);
    if (hasStyles) {
      html += `<hr class="__edge_devtools_divider">`;
      if (colorHex) {
        html += `
          <div class="__edge_devtools_row">
            <span class="__edge_devtools_prop_label">Color</span>
            <span class="__edge_devtools_prop_val">
              <span class="__edge_devtools_color_swatch" style="background-color: ${computed.color};"></span>
              ${colorHex}
            </span>
          </div>
        `;
      }
      if (fontSize && primaryFont) {
        html += `
          <div class="__edge_devtools_row">
            <span class="__edge_devtools_prop_label">Font</span>
            <span class="__edge_devtools_prop_val" style="max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${fontSize} ${primaryFont}
            </span>
          </div>
        `;
      }
    }

    // ACCESSIBILITY section (exactly as in Google DevTools)
    html += `
      <div class="__edge_devtools_section_header">ACCESSIBILITY</div>
      ${nameText ? `
        <div class="__edge_devtools_row">
          <span class="__edge_devtools_prop_label">Name</span>
          <span class="__edge_devtools_prop_val" style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${nameText}</span>
        </div>
      ` : ""}
      <div class="__edge_devtools_row">
        <span class="__edge_devtools_prop_label">Role</span>
        <span class="__edge_devtools_prop_val">${role}</span>
      </div>
      <div class="__edge_devtools_row">
        <span class="__edge_devtools_prop_label">Keyboard-focusable</span>
        <span class="__edge_devtools_prop_val">${focusable ? "✓" : "⊘"}</span>
      </div>
    `;

    badgeEl.innerHTML = html;
    badgeEl.className = "__edge_inspector_badge __active";
    badgeEl.style.display = "flex";

    // Position tooltip precisely like Chrome DevTools
    const badgeHeight = badgeEl.offsetHeight || 110;
    const badgeWidth = badgeEl.offsetWidth || 230;

    let badgeTop = rect.top - badgeHeight - 8;
    if (badgeTop < 10) {
      // Place below element if it would go off top of viewport
      badgeTop = rect.bottom + 8;
    }
    // Prevent going off bottom
    if (badgeTop + badgeHeight > window.innerHeight - 10) {
      badgeTop = Math.max(10, window.innerHeight - badgeHeight - 10);
    }

    let badgeLeft = Math.max(10, Math.min(rect.left, window.innerWidth - badgeWidth - 16));

    badgeEl.style.top = `${badgeTop}px`;
    badgeEl.style.left = `${badgeLeft}px`;
  }

  function onMouseMove(e) {
    if (!isInspectMode) return;

    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target === overlayEl || target === badgeEl || target.closest(".__edge_inspector_badge")) {
      return;
    }

    hoveredElement = target;
    updateOverlayPosition(target);
  }

  function onClick(e) {
    if (!isInspectMode) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const target = hoveredElement || document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target === overlayEl || target === badgeEl) return;

    // Immediately stop inspector mode so it does not keep inspecting / popping up
    stopInspector();

    if (selectedElement) {
      selectedElement.classList.remove("__edge_highlight_selected");
    }

    selectedElement = target;
    selectedElement.classList.add("__edge_highlight_selected");

    const data = extractElementData(target);

    chrome.runtime.sendMessage({
      action: "ELEMENT_SELECTED",
      element: data,
      hostname: window.location.hostname,
    });

    chrome.runtime.sendMessage({ action: "INSPECTOR_STOPPED" });
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      if (isInspectMode) {
        stopInspector();
        chrome.runtime.sendMessage({ action: "INSPECTOR_STOPPED" });
      }
      if (isAreaSelectMode) {
        stopAreaSelection();
        chrome.runtime.sendMessage({ action: "AREA_SELECTION_CANCELLED" });
      }
      if (selectedElement) {
        selectedElement.classList.remove("__edge_highlight_selected");
        selectedElement = null;
        chrome.runtime.sendMessage({ action: "ELEMENT_DESELECTED" });
      }
      document.querySelectorAll(".__edge_highlight_selected, .__edge_highlight_temp").forEach((el) => {
        el.classList.remove("__edge_highlight_selected", "__edge_highlight_temp");
      });
      if (overlayEl) {
        overlayEl.className = "__edge_inspector_overlay";
        overlayEl.style.display = "none";
      }
      if (badgeEl) {
        badgeEl.style.display = "none";
        badgeEl.innerHTML = "";
      }
    }
  }

  function startInspector() {
    createOverlays();
    isInspectMode = true;
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.body.style.cursor = "crosshair";
  }

  function stopInspector() {
    isInspectMode = false;
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKeyDown, true);
    document.body.style.cursor = "";

    if (overlayEl) {
      overlayEl.className = "__edge_inspector_overlay";
      overlayEl.style.display = "none";
    }
    if (badgeEl) {
      badgeEl.style.display = "none";
      badgeEl.innerHTML = "";
    }
    hoveredElement = null;
  }

  // Complete cleanup of all inspector artifacts when panel is closed or reset
  function cleanupAllInspectorArtifacts() {
    stopInspector();
    stopAreaSelection();

    // Remove any highlights on DOM elements
    document.querySelectorAll(".__edge_highlight_selected, .__edge_highlight_temp").forEach((el) => {
      el.classList.remove("__edge_highlight_selected", "__edge_highlight_temp");
    });
    selectedElement = null;
    tempHighlightEl = null;
    hoveredElement = null;

    // Remove visual helper classes if active
    document.body.classList.remove("__edge_grid_outlines", "__edge_baseline_grid");

    // Remove overlays from DOM if present
    if (overlayEl && overlayEl.parentNode) {
      overlayEl.remove();
      overlayEl = null;
    }
    if (badgeEl && badgeEl.parentNode) {
      badgeEl.remove();
      badgeEl = null;
    }
    if (areaOverlay && areaOverlay.parentNode) {
      areaOverlay.remove();
      areaOverlay = null;
    }
  }

  // --- AREA SELECTION TOOL ---
  function startAreaSelection() {
    if (areaOverlay) return;
    isAreaSelectMode = true;

    areaOverlay = document.createElement("div");
    areaOverlay.className = "__edge_area_overlay";

    areaBox = document.createElement("div");
    areaBox.className = "__edge_area_selection_box";
    areaBox.style.display = "none";

    areaDim = document.createElement("div");
    areaDim.className = "__edge_area_selection_dim";
    areaBox.appendChild(areaDim);

    areaOverlay.appendChild(areaBox);
    document.documentElement.appendChild(areaOverlay);

    areaOverlay.addEventListener("mousedown", onAreaMouseDown);
    window.addEventListener("mousemove", onAreaMouseMove);
    window.addEventListener("mouseup", onAreaMouseUp);
    document.addEventListener("keydown", onKeyDown, true);
  }

  function stopAreaSelection() {
    isAreaSelectMode = false;
    if (areaOverlay) {
      areaOverlay.removeEventListener("mousedown", onAreaMouseDown);
      window.removeEventListener("mousemove", onAreaMouseMove);
      window.removeEventListener("mouseup", onAreaMouseUp);
      areaOverlay.remove();
      areaOverlay = null;
      areaBox = null;
      areaDim = null;
    }
  }

  function onAreaMouseDown(e) {
    isDraggingArea = true;
    startX = e.clientX;
    startY = e.clientY;
    areaBox.style.left = `${startX}px`;
    areaBox.style.top = `${startY}px`;
    areaBox.style.width = "0px";
    areaBox.style.height = "0px";
    areaBox.style.display = "block";
    areaDim.textContent = "0 × 0 px";
  }

  function onAreaMouseMove(e) {
    if (!isDraggingArea || !areaBox) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    areaBox.style.left = `${left}px`;
    areaBox.style.top = `${top}px`;
    areaBox.style.width = `${width}px`;
    areaBox.style.height = `${height}px`;
    areaDim.textContent = `${Math.round(width)} × ${Math.round(height)} px`;
  }

  async function onAreaMouseUp(e) {
    if (!isDraggingArea) return;
    isDraggingArea = false;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    stopAreaSelection();

    if (width < 5 || height < 5) return;

    // Crop area from visible tab screenshot
    chrome.runtime.sendMessage({ action: "CAPTURE_VISIBLE_TAB" }, (response) => {
      if (response && response.dataUrl) {
        cropImage(response.dataUrl, {
          x: left * window.devicePixelRatio,
          y: top * window.devicePixelRatio,
          width: width * window.devicePixelRatio,
          height: height * window.devicePixelRatio,
        }).then((croppedUrl) => {
          chrome.runtime.sendMessage({
            action: "AREA_CAPTURED",
            dataUrl: croppedUrl,
            width: Math.round(width),
            height: Math.round(height),
          });
        });
      }
    });
  }

  function cropImage(dataUrl, rect) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, rect.width);
        canvas.height = Math.max(1, rect.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          img,
          rect.x,
          rect.y,
          rect.width,
          rect.height,
          0,
          0,
          rect.width,
          rect.height
        );
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = dataUrl;
    });
  }

  // Extract Global Assets
  function extractPageAssets() {
    const colors = new Set();
    const fonts = new Set();
    const images = [];
    const headings = [];

    const elements = document.querySelectorAll("*");
    const maxElements = Math.min(elements.length, 600);

    for (let i = 0; i < maxElements; i++) {
      const el = elements[i];
      if (el.nodeType !== Node.ELEMENT_NODE) continue;
      const comp = window.getComputedStyle(el);

      if (comp.color && comp.color !== "rgba(0, 0, 0, 0)") colors.add(comp.color);
      if (comp.backgroundColor && comp.backgroundColor !== "rgba(0, 0, 0, 0)") colors.add(comp.backgroundColor);
      if (comp.borderColor && comp.borderColor !== "rgba(0, 0, 0, 0)") colors.add(comp.borderColor);
      if (comp.fontFamily) {
        const primaryFont = comp.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
        if (primaryFont) fonts.add(primaryFont);
      }
    }

    document.querySelectorAll("img").forEach((img, idx) => {
      if (img.src && idx < 50) {
        images.push({
          src: img.src,
          alt: img.alt || "Imagem",
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
        });
      }
    });

    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      headings.push({
        tag: h.nodeName.toLowerCase(),
        text: (h.textContent || "").trim(),
        selector: getUniqueSelector(h),
      });
    });

    return {
      title: document.title,
      url: window.location.href,
      hostname: window.location.hostname,
      colors: Array.from(colors).slice(0, 45),
      fonts: Array.from(fonts).slice(0, 20),
      images: images,
      headings: headings.slice(0, 50),
    };
  }

  // Get Page Diagnostics
  function getPageDiagnostics() {
    const all = document.querySelectorAll("*");
    let maxDepth = 0;

    function findDepth(node, depth) {
      if (depth > maxDepth) maxDepth = depth;
      for (let i = 0; i < node.children.length; i++) {
        findDepth(node.children[i], depth + 1);
      }
    }
    findDepth(document.documentElement, 1);

    const timing = window.performance && window.performance.timing;
    const loadTime = timing ? Math.round(timing.loadEventEnd - timing.navigationStart) : 0;

    return {
      totalElements: all.length,
      maxDomDepth: maxDepth,
      scriptsCount: document.querySelectorAll("script").length,
      stylesheetsCount: document.querySelectorAll("link[rel='stylesheet'], style").length,
      imagesCount: document.querySelectorAll("img").length,
      iframesCount: document.querySelectorAll("iframe").length,
      loadTime: loadTime > 0 ? `${loadTime}ms` : "Instantâneo",
      doctype: document.doctype ? document.doctype.name : "Nenhum",
      charset: document.characterSet || "UTF-8",
    };
  }

  // Read Web Storage & Cookies
  function getSiteStorage() {
    const local = {};
    const session = {};

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        local[k] = (localStorage.getItem(k) || "").slice(0, 200);
      }
    } catch (e) {}

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        session[k] = (session.getItem(k) || "").slice(0, 200);
      }
    } catch (e) {}

    const cookies = document.cookie ? document.cookie.split(";").map(c => {
      const parts = c.trim().split("=");
      return { name: parts[0], value: (parts.slice(1).join("=") || "").slice(0, 100) };
    }) : [];

    return {
      localStorage: local,
      sessionStorage: session,
      cookies: cookies,
      hostname: window.location.hostname,
    };
  }

  // Message Handler
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "START_INSPECTOR") {
      startInspector();
      sendResponse({ success: true, isInspectMode: true });
      return true;
    }

    if (message.action === "STOP_INSPECTOR") {
      stopInspector();
      sendResponse({ success: true, isInspectMode: false });
      return true;
    }

    if (message.action === "CLEANUP_ALL_INSPECTOR") {
      cleanupAllInspectorArtifacts();
      sendResponse({ success: true, cleaned: true });
      return true;
    }

    if (message.action === "TOGGLE_INSPECTOR") {
      if (isInspectMode) stopInspector();
      else startInspector();
      sendResponse({ success: true, isInspectMode: isInspectMode });
      return true;
    }

    if (message.action === "START_AREA_SELECTION") {
      stopInspector();
      startAreaSelection();
      sendResponse({ success: true });
      return true;
    }

    if (message.action === "CAPTURE_ELEMENT_IMAGE" || message.action === "CAPTURE_SECTION_IMAGE") {
      let targetEl = selectedElement;
      if (message.action === "CAPTURE_SECTION_IMAGE") {
        targetEl = findNearestContainer(selectedElement || document.body);
      }

      if (!targetEl) {
        sendResponse({ success: false, error: "Nenhum bloco/section ou elemento selecionado" });
        return true;
      }
      
      const rect = targetEl.getBoundingClientRect();
      const containerTag = targetEl.nodeName.toLowerCase();
      
      chrome.runtime.sendMessage({ action: "CAPTURE_VISIBLE_TAB" }, (response) => {
        if (response && response.dataUrl) {
          cropImage(response.dataUrl, {
            x: Math.max(0, rect.left * window.devicePixelRatio),
            y: Math.max(0, rect.top * window.devicePixelRatio),
            width: Math.min(window.innerWidth, rect.width) * window.devicePixelRatio,
            height: Math.min(window.innerHeight, rect.height) * window.devicePixelRatio,
          }).then((croppedUrl) => {
            sendResponse({ 
              success: true, 
              dataUrl: croppedUrl, 
              tag: containerTag,
              width: Math.round(rect.width), 
              height: Math.round(rect.height) 
            });
          });
        } else {
          sendResponse({ success: false, error: "Falha na captura" });
        }
      });
      return true;
    }

    if (message.action === "DESELECT_ELEMENT" || message.action === "RESET_ALL_SELECTIONS") {
      if (selectedElement) {
        selectedElement.classList.remove("__edge_highlight_selected");
        selectedElement = null;
      }
      document.querySelectorAll(".__edge_highlight_selected, .__edge_highlight_temp").forEach((el) => {
        el.classList.remove("__edge_highlight_selected", "__edge_highlight_temp");
      });
      if (overlayEl) {
        overlayEl.className = "__edge_inspector_overlay";
        overlayEl.style.display = "none";
      }
      if (badgeEl) {
        badgeEl.style.display = "none";
        badgeEl.innerHTML = "";
      }
      sendResponse({ success: true, deselected: true });
      return true;
    }

    if (message.action === "TOGGLE_GRID_OUTLINES") {
      document.body.classList.toggle("__edge_grid_outlines");
      sendResponse({ enabled: document.body.classList.contains("__edge_grid_outlines") });
      return true;
    }

    if (message.action === "TOGGLE_BASELINE_GRID") {
      document.body.classList.toggle("__edge_baseline_grid");
      sendResponse({ enabled: document.body.classList.contains("__edge_baseline_grid") });
      return true;
    }

    if (message.action === "GET_SITE_STORAGE") {
      sendResponse({ success: true, storage: getSiteStorage() });
      return true;
    }

    if (message.action === "GET_PAGE_DIAGNOSTICS") {
      sendResponse({ success: true, diagnostics: getPageDiagnostics() });
      return true;
    }

    if (message.action === "GET_INSPECT_STATE") {
      sendResponse({ isInspectMode: isInspectMode });
      return true;
    }

    if (message.action === "GET_PAGE_ASSETS") {
      const assets = extractPageAssets();
      sendResponse({ success: true, assets });
      return true;
    }

    if (message.action === "HIGHLIGHT_SELECTOR") {
      if (tempHighlightEl) tempHighlightEl.classList.remove("__edge_highlight_temp");
      try {
        const target = document.querySelector(message.selector);
        if (target) {
          tempHighlightEl = target;
          target.classList.add("__edge_highlight_temp");
          sendResponse({ success: true });
        }
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }

    if (message.action === "UNHIGHLIGHT") {
      if (tempHighlightEl) {
        tempHighlightEl.classList.remove("__edge_highlight_temp");
        tempHighlightEl = null;
      }
      sendResponse({ success: true });
      return true;
    }

    if (message.action === "SELECT_BY_SELECTOR") {
      try {
        const target = document.querySelector(message.selector);
        if (target) {
          if (selectedElement) selectedElement.classList.remove("__edge_highlight_selected");
          selectedElement = target;
          selectedElement.classList.add("__edge_highlight_selected");
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          const data = extractElementData(target);
          sendResponse({ success: true, element: data });
        } else {
          sendResponse({ success: false, error: "Elemento não encontrado" });
        }
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }

    if (message.action === "UPDATE_ELEMENT_STYLE") {
      if (selectedElement && message.property) {
        selectedElement.style[message.property] = message.value;
        const updatedData = extractElementData(selectedElement);
        sendResponse({ success: true, element: updatedData });
      } else {
        sendResponse({ success: false, error: "Nenhum elemento selecionado" });
      }
      return true;
    }

    if (message.action === "HIDE_ELEMENT") {
      if (selectedElement) {
        selectedElement.style.display = selectedElement.style.display === "none" ? "" : "none";
        sendResponse({ success: true, isHidden: selectedElement.style.display === "none" });
      } else {
        sendResponse({ success: false, error: "Nenhum elemento selecionado" });
      }
      return true;
    }

    if (message.action === "DELETE_ELEMENT") {
      if (selectedElement) {
        selectedElement.remove();
        selectedElement = null;
        if (overlayEl) overlayEl.className = "__edge_inspector_overlay";
        if (badgeEl) badgeEl.style.display = "none";
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "Nenhum elemento selecionado" });
      }
      return true;
    }

    if (message.action === "SCROLL_TO_ELEMENT") {
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: "smooth", block: "center" });
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
      return true;
    }

    if (message.action === "APPLY_CUSTOM_CSS") {
      let styleTag = document.getElementById("__edge_custom_css_injector");
      const isEnabled = message.enabled !== false;
      const cssContent = (message.css || "").trim();

      if (!isEnabled || !cssContent) {
        if (styleTag) {
          styleTag.remove();
        }
        sendResponse({ success: true, applied: false });
        return true;
      }

      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "__edge_custom_css_injector";
        styleTag.setAttribute("type", "text/css");
        (document.head || document.documentElement).appendChild(styleTag);
      }

      styleTag.textContent = message.css;
      sendResponse({ success: true, applied: true, length: cssContent.length });
      return true;
    }

    if (message.action === "TOGGLE_CONTENT_EDITABLE") {
      if (!selectedElement) {
        sendResponse({ success: false, error: "Nenhum elemento selecionado" });
        return true;
      }

      const isEditable = selectedElement.isContentEditable;
      if (isEditable) {
        selectedElement.contentEditable = "false";
        selectedElement.classList.remove("__edge_editing_text");
        sendResponse({ success: true, isEditing: false });
      } else {
        selectedElement.contentEditable = "true";
        selectedElement.classList.add("__edge_editing_text");
        selectedElement.focus();
        sendResponse({ success: true, isEditing: true });
      }
      return true;
    }

    if (message.action === "TOGGLE_DESIGN_MODE") {
      const current = document.designMode === "on";
      document.designMode = current ? "off" : "on";
      document.body.classList.toggle("__edge_design_mode_active", !current);
      sendResponse({ success: true, isDesignMode: !current });
      return true;
    }

    if (message.action === "DUPLICATE_ELEMENT") {
      if (!selectedElement || !selectedElement.parentNode) {
        sendResponse({ success: false, error: "Nenhum elemento selecionado para duplicar" });
        return true;
      }
      try {
        const clone = selectedElement.cloneNode(true);
        clone.classList.remove("__edge_highlight_selected", "__edge_highlight_temp", "__edge_editing_text");
        if (clone.id) clone.id = `${clone.id}-copy-${Date.now().toString().slice(-4)}`;
        selectedElement.parentNode.insertBefore(clone, selectedElement.nextSibling);
        sendResponse({ success: true });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }

    if (message.action === "MOVE_ELEMENT") {
      if (!selectedElement || !selectedElement.parentNode) {
        sendResponse({ success: false, error: "Nenhum elemento selecionado" });
        return true;
      }
      const parent = selectedElement.parentNode;
      if (message.direction === "up") {
        const prev = selectedElement.previousElementSibling;
        if (prev) {
          parent.insertBefore(selectedElement, prev);
          selectedElement.scrollIntoView({ behavior: "smooth", block: "center" });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: "Elemento já é o primeiro da lista" });
        }
      } else if (message.direction === "down") {
        const next = selectedElement.nextElementSibling;
        if (next) {
          parent.insertBefore(next, selectedElement);
          selectedElement.scrollIntoView({ behavior: "smooth", block: "center" });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: "Elemento já é o último da lista" });
        }
      }
      return true;
    }

    if (message.action === "REPLACE_ELEMENT_IMAGE") {
      if (!selectedElement) {
        sendResponse({ success: false, error: "Nenhum elemento selecionado" });
        return true;
      }
      const newSrc = message.src;
      if (!newSrc) {
        sendResponse({ success: false, error: "URL ou imagem inválida" });
        return true;
      }

      const tag = selectedElement.tagName.toLowerCase();
      if (tag === "img") {
        selectedElement.src = newSrc;
        if (selectedElement.hasAttribute("srcset")) {
          selectedElement.removeAttribute("srcset");
        }
      } else {
        selectedElement.style.backgroundImage = `url("${newSrc}")`;
        selectedElement.style.backgroundSize = "cover";
        selectedElement.style.backgroundPosition = "center";
      }

      const updated = extractElementData(selectedElement);
      sendResponse({ success: true, element: updated });
      return true;
    }

    if (message.action === "UPDATE_ELEMENT_TEXT") {
      if (!selectedElement) {
        sendResponse({ success: false, error: "Nenhum elemento selecionado" });
        return true;
      }
      selectedElement.textContent = message.text || "";
      const updated = extractElementData(selectedElement);
      sendResponse({ success: true, element: updated });
      return true;
    }

    if (message.action === "PING") {
      sendResponse({ pong: true, title: document.title, url: window.location.href, hostname: window.location.hostname });
      return true;
    }
  });

  console.log("Edge Web Inspector v2.0 Content Script initialized.");
})();
