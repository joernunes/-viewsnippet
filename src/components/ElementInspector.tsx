import React, { useState, useEffect } from "react";
import {
  MousePointer,
  Layers,
  Palette,
  Tag,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Type,
  Code2,
  Check,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Box,
  Wand2,
  Component,
  Bold,
  Italic,
  Underline,
  Baseline,
  CaseSensitive,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  Grid,
  Sliders,
  Move,
  Layout,
  Scaling,
  Frame,
  Layers as LayersIcon,
  Globe,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { GoogleFontsModal } from "./GoogleFontsModal";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

export interface SelectedElementData {
  index: number;
  tagName: string;
  id: string;
  className: string;
  classList: string[];
  innerText: string;
  innerHTML: string;
  outerHTML: string;
  attributes: { name: string; value: string }[];
  rect: { width: number; height: number; top: number; left: number };
  breadcrumbs: { index: number; tagName: string; id: string; className: string }[];
  boxModel: {
    margin: { top: number; right: number; bottom: number; left: number };
    padding: { top: number; right: number; bottom: number; left: number };
    border: { top: number; right: number; bottom: number; left: number };
    content: { width: number; height: number };
  };
  styles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontFamily: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textTransform?: string;
    fontStyle?: string;
    textDecoration?: string;
    padding: string;
    margin: string;
    display: string;
    borderRadius: string;
    border: string;
    textAlign: string;
    flexDirection: string;
    gap: string;
    inlineStyle: string;
  };
}

export interface DomTreeNode {
  type: "element" | "text";
  index?: number;
  tagName?: string;
  id?: string;
  className?: string;
  text?: string;
  children?: DomTreeNode[];
}

interface ElementInspectorProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  code: string;
  onCodeChange?: (newCode: string, options?: { isIframeSelfUpdate?: boolean }) => void;
  isInspectMode: boolean;
  setIsInspectMode: (val: boolean) => void;
  readOnly?: boolean;
  externalSiteUrl?: string | null;
  onClearExternalSite?: () => void;
  onInspectExternalSite?: (url: string) => void;
}

export const INSPECTOR_INJECT_SCRIPT = `
<script id="dom-inspector-script">
(function() {
  let isInspectMode = true;
  let hoverOverlay = null;
  let selectedOverlay = null;
  let selectedElement = null;

  function createOverlays() {
    if (!document.body) return;
    if (!document.getElementById('inspector-hover-overlay')) {
      hoverOverlay = document.createElement('div');
      hoverOverlay.id = 'inspector-hover-overlay';
      hoverOverlay.style.cssText = 'position:fixed; pointer-events:none; border:2px dashed #3b82f6; background:rgba(59,130,246,0.12); z-index:999999; display:none; transition:all 0.05s ease; border-radius:3px;';
      
      const tooltip = document.createElement('div');
      tooltip.id = 'inspector-tooltip';
      tooltip.style.cssText = 'position:absolute; top:-26px; left:0; background:#0f172a; color:#38bdf8; font-size:11px; font-family:monospace; font-weight:600; padding:2px 8px; border-radius:4px; border:1px solid #0284c7; white-space:nowrap; pointer-events:none; box-shadow:0 4px 6px -1px rgba(0,0,0,0.5);';
      hoverOverlay.appendChild(tooltip);
      document.body.appendChild(hoverOverlay);
    } else {
      hoverOverlay = document.getElementById('inspector-hover-overlay');
    }

    if (!document.getElementById('inspector-selected-overlay')) {
      selectedOverlay = document.createElement('div');
      selectedOverlay.id = 'inspector-selected-overlay';
      selectedOverlay.style.cssText = 'position:fixed; pointer-events:none; border:2px solid #10b981; background:rgba(16,185,129,0.12); z-index:999998; display:none; border-radius:3px; box-shadow:0 0 0 1px rgba(16,185,129,0.3);';
      document.body.appendChild(selectedOverlay);
    } else {
      selectedOverlay = document.getElementById('inspector-selected-overlay');
    }
  }

  function getElementIndex(el) {
    if (!el || !document.body) return -1;
    const all = Array.from(document.body.querySelectorAll('*'));
    return all.indexOf(el);
  }

  function getElementByIndex(idx) {
    if (idx === -1) return document.body;
    const all = Array.from(document.body.querySelectorAll('*'));
    return all[idx] || null;
  }

  function getElementInfo(el) {
    if (!el || el === document.body || el.id?.startsWith('inspector-')) return null;
    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);
    const attrs = [];
    if (el.attributes) {
      for (let i = 0; i < el.attributes.length; i++) {
        const a = el.attributes[i];
        if (!a.name.startsWith('data-inspector') && a.name !== 'contenteditable') {
          attrs.push({ name: a.name, value: a.value });
        }
      }
    }

    // Compute DOM Ancestry Breadcrumbs
    const breadcrumbs = [];
    let curr = el;
    while (curr && curr !== document.documentElement && !curr.id?.startsWith('inspector-')) {
      breadcrumbs.unshift({
        index: getElementIndex(curr),
        tagName: curr.tagName.toLowerCase(),
        id: curr.id || '',
        className: typeof curr.className === 'string' ? curr.className : ''
      });
      curr = curr.parentElement;
    }

    // Compute Box Model Numeric Values
    const boxModel = {
      margin: {
        top: Math.round(parseFloat(computed.marginTop) || 0),
        right: Math.round(parseFloat(computed.marginRight) || 0),
        bottom: Math.round(parseFloat(computed.marginBottom) || 0),
        left: Math.round(parseFloat(computed.marginLeft) || 0)
      },
      padding: {
        top: Math.round(parseFloat(computed.paddingTop) || 0),
        right: Math.round(parseFloat(computed.paddingRight) || 0),
        bottom: Math.round(parseFloat(computed.paddingBottom) || 0),
        left: Math.round(parseFloat(computed.paddingLeft) || 0)
      },
      border: {
        top: Math.round(parseFloat(computed.borderTopWidth) || 0),
        right: Math.round(parseFloat(computed.borderRightWidth) || 0),
        bottom: Math.round(parseFloat(computed.borderBottomWidth) || 0),
        left: Math.round(parseFloat(computed.borderLeftWidth) || 0)
      },
      content: {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
    };

    return {
      index: getElementIndex(el),
      tagName: el.tagName.toLowerCase(),
      id: el.id || '',
      className: typeof el.className === 'string' ? el.className : '',
      classList: Array.from(el.classList || []).filter(c => typeof c === 'string' && !c.startsWith('inspector-')),
      innerText: el.innerText || '',
      innerHTML: el.innerHTML || '',
      outerHTML: el.outerHTML || '',
      attributes: attrs,
      breadcrumbs: breadcrumbs,
      boxModel: boxModel,
      rect: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left)
      },
      styles: {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontFamily: computed.fontFamily,
        fontWeight: computed.fontWeight,
        lineHeight: computed.lineHeight,
        letterSpacing: computed.letterSpacing,
        textTransform: computed.textTransform,
        fontStyle: computed.fontStyle,
        textDecoration: computed.textDecorationLine || computed.textDecoration,
        padding: computed.padding,
        margin: computed.margin,
        display: computed.display,
        borderRadius: computed.borderRadius,
        border: computed.border,
        textAlign: computed.textAlign,
        flexDirection: computed.flexDirection,
        gap: computed.gap,
        inlineStyle: el.getAttribute('style') || ''
      }
    };
  }

  function highlightElement(el, isHover) {
    if (!el || el === document.body || el.id?.startsWith('inspector-')) return;
    createOverlays();
    const rect = el.getBoundingClientRect();
    const overlay = isHover ? hoverOverlay : selectedOverlay;
    if (!overlay) return;

    overlay.style.top = Math.max(0, rect.top) + 'px';
    overlay.style.left = Math.max(0, rect.left) + 'px';
    overlay.style.width = Math.max(4, rect.width) + 'px';
    overlay.style.height = Math.max(4, rect.height) + 'px';
    overlay.style.display = 'block';

    if (isHover) {
      const tooltip = overlay.querySelector('#inspector-tooltip');
      if (tooltip) {
        const idStr = el.id ? '#' + el.id : '';
        const classStr = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).filter(Boolean).join('.') : '';
        tooltip.textContent = '<' + el.tagName.toLowerCase() + idStr + classStr + '> (' + Math.round(rect.width) + 'x' + Math.round(rect.height) + 'px)';
      }
    }
  }

  function unhighlightHover() {
    if (hoverOverlay) hoverOverlay.style.display = 'none';
  }

  function handleMouseOver(e) {
    if (!isInspectMode) return;
    let target = e.target;
    if (!target || target.id?.startsWith('inspector-')) return;
    highlightElement(target, true);
  }

  function handleMouseOut(e) {
    if (!isInspectMode) return;
    unhighlightHover();
  }

  function handleClick(e) {
    if (!isInspectMode && !window.__isInspectMode) return;
    let target = e.target;
    if (!target || target.id?.startsWith('inspector-')) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') {
      e.stopImmediatePropagation();
    }

    selectedElement = target;
    highlightElement(target, false);

    const info = getElementInfo(target);
    if (info) {
      window.parent.postMessage({ type: 'INSPECTOR_ELEMENT_SELECTED', data: info }, '*');
    }
  }

  function handleDblClick(e) {
    if (!isInspectMode && !window.__isInspectMode) return;
    let target = e.target;
    if (!target || target.id?.startsWith('inspector-')) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') {
      e.stopImmediatePropagation();
    }

    target.contentEditable = 'true';
    target.focus();

    const onBlur = () => {
      target.contentEditable = 'false';
      target.removeEventListener('blur', onBlur);
      sendSerializedHtml();
    };

    target.addEventListener('blur', onBlur);
  }

  function cleanBodyHtml() {
    if (!document.body) return '';
    const clone = document.body.cloneNode(true);
    const h = clone.querySelector('#inspector-hover-overlay');
    if (h) h.remove();
    const s = clone.querySelector('#inspector-selected-overlay');
    if (s) s.remove();
    const sc = clone.querySelector('#dom-inspector-script');
    if (sc) sc.remove();

    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    return clone.innerHTML;
  }

  function sendSerializedHtml() {
    const cleanHtml = cleanBodyHtml();
    window.parent.postMessage({
      type: 'INSPECTOR_HTML_UPDATED',
      html: cleanHtml
    }, '*');
    if (selectedElement) {
      setTimeout(() => highlightElement(selectedElement, false), 50);
    }
  }

  function sendDomTree() {
    if (!document.body) return;
    function buildTree(node) {
      if (node.nodeType === 3) {
        const txt = node.textContent ? node.textContent.trim() : '';
        if (!txt) return null;
        return { type: 'text', text: txt };
      }
      if (node.nodeType !== 1) return null;
      if (node.id?.startsWith('inspector-')) return null;

      const children = Array.from(node.childNodes)
        .map(buildTree)
        .filter(Boolean);

      return {
        type: 'element',
        index: getElementIndex(node),
        tagName: node.tagName.toLowerCase(),
        id: node.id || '',
        className: typeof node.className === 'string' ? node.className : '',
        children: children
      };
    }

    const tree = buildTree(document.body);
    window.parent.postMessage({ type: 'INSPECTOR_DOM_TREE_RESPONSE', tree: tree }, '*');
  }

  window.addEventListener('message', function(event) {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'SET_INSPECT_MODE') {
      isInspectMode = !!msg.enabled;
      window.__isInspectMode = !!msg.enabled;
      if (!isInspectMode) {
        unhighlightHover();
        if (selectedOverlay) selectedOverlay.style.display = 'none';
      } else {
        createOverlays();
      }
    } else if (msg.type === 'SELECT_ELEMENT_BY_INDEX') {
      const el = getElementByIndex(msg.index);
      if (el) {
        selectedElement = el;
        highlightElement(el, false);
        try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(err){}
        const info = getElementInfo(el);
        if (info) {
          window.parent.postMessage({ type: 'INSPECTOR_ELEMENT_SELECTED', data: info }, '*');
        }
      }
    } else if (msg.type === 'APPLY_BOX_MODEL') {
      const el = getElementByIndex(msg.index);
      if (el) {
        if (msg.margin) {
          const clampM = function(v) {
            const num = parseFloat(v) || 0;
            return Math.max(-100, Math.min(200, num));
          };
          el.style.marginTop = clampM(msg.margin.top) + 'px';
          el.style.marginRight = clampM(msg.margin.right) + 'px';
          el.style.marginBottom = clampM(msg.margin.bottom) + 'px';
          el.style.marginLeft = clampM(msg.margin.left) + 'px';
        }
        if (msg.padding) {
          const clampP = function(v) {
            const num = parseFloat(v) || 0;
            return Math.max(0, Math.min(300, num));
          };
          el.style.paddingTop = clampP(msg.padding.top) + 'px';
          el.style.paddingRight = clampP(msg.padding.right) + 'px';
          el.style.paddingBottom = clampP(msg.padding.bottom) + 'px';
          el.style.paddingLeft = clampP(msg.padding.left) + 'px';
        }
        highlightElement(el, false);
        sendSerializedHtml();
      }
    } else if (msg.type === 'UPDATE_ELEMENT_TEXT') {
      const el = getElementByIndex(msg.index);
      if (el) {
        el.innerText = msg.text;
        highlightElement(el, false);
        sendSerializedHtml();
      }
    } else if (msg.type === 'UPDATE_ELEMENT_HTML') {
      const el = getElementByIndex(msg.index);
      if (el) {
        el.innerHTML = msg.html;
        highlightElement(el, false);
        sendSerializedHtml();
      }
    } else if (msg.type === 'UPDATE_ELEMENT_CLASSES') {
      const el = getElementByIndex(msg.index);
      if (el) {
        el.className = msg.classes;
        highlightElement(el, false);
        sendSerializedHtml();
      }
    } else if (msg.type === 'UPDATE_ELEMENT_STYLE') {
      const el = getElementByIndex(msg.index);
      if (el) {
        if (msg.styleString !== undefined) {
          el.setAttribute('style', msg.styleString);
        } else if (msg.property) {
          el.style[msg.property] = msg.value;
        }
        highlightElement(el, false);
        sendSerializedHtml();
      }
    } else if (msg.type === 'UPDATE_ELEMENT_ATTRIBUTE') {
      const el = getElementByIndex(msg.index);
      if (el) {
        if (msg.value === null || msg.value === undefined) {
          el.removeAttribute(msg.name);
        } else {
          el.setAttribute(msg.name, msg.value);
        }
        highlightElement(el, false);
        sendSerializedHtml();
      }
    } else if (msg.type === 'DELETE_ELEMENT') {
      const el = getElementByIndex(msg.index);
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
        if (selectedOverlay) selectedOverlay.style.display = 'none';
        selectedElement = null;
        sendSerializedHtml();
      }
    } else if (msg.type === 'DUPLICATE_ELEMENT') {
      const el = getElementByIndex(msg.index);
      if (el && el.parentNode) {
        const clone = el.cloneNode(true);
        el.parentNode.insertBefore(clone, el.nextSibling);
        sendSerializedHtml();
      }
    } else if (msg.type === 'INSERT_CHILD_ELEMENT') {
      const el = getElementByIndex(msg.index) || document.body;
      const newEl = document.createElement(msg.tagName || 'div');
      if (msg.text) newEl.textContent = msg.text;
      if (msg.className) newEl.className = msg.className;
      if (msg.style) newEl.setAttribute('style', msg.style);
      el.appendChild(newEl);
      sendSerializedHtml();
    } else if (msg.type === 'MOVE_ELEMENT') {
      const el = getElementByIndex(msg.index);
      if (el && el.parentNode) {
        if (msg.direction === 'up' && el.previousElementSibling) {
          el.parentNode.insertBefore(el, el.previousElementSibling);
        } else if (msg.direction === 'down' && el.nextElementSibling) {
          el.parentNode.insertBefore(el.nextElementSibling, el);
        }
        sendSerializedHtml();
      }
    } else if (msg.type === 'GET_DOM_TREE') {
      sendDomTree();
    }
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    createOverlays();
  } else {
    document.addEventListener('DOMContentLoaded', createOverlays);
  }

  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('dblclick', handleDblClick, true);
})();
</script>
`;

// Bounds & Limits for Box Model Margins and Padding
const MIN_MARGIN = -100;
const MAX_MARGIN = 200;
const MIN_PADDING = 0;
const MAX_PADDING = 300;

const clampMargin = (val: number) => {
  if (isNaN(val)) return 0;
  return Math.max(MIN_MARGIN, Math.min(MAX_MARGIN, val));
};

const clampPadding = (val: number) => {
  if (isNaN(val)) return 0;
  return Math.max(MIN_PADDING, Math.min(MAX_PADDING, val));
};

export function ElementInspector({
  iframeRef,
  code,
  onCodeChange,
  isInspectMode,
  setIsInspectMode,
  readOnly = false,
  externalSiteUrl = null,
  onClearExternalSite,
  onInspectExternalSite,
}: ElementInspectorProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElementData | null>(null);
  const [activeTab, setActiveTab] = useState<"props" | "box" | "styles" | "presets" | "attrs" | "tree">("props");
  const [domTree, setDomTree] = useState<DomTreeNode | null>(null);

  // Resize and collapse panel states
  const [inspectorHeight, setInspectorHeight] = useState(280);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // External Site Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrlInput, setImportUrlInput] = useState("");
  const [isImportingUrl, setIsImportingUrl] = useState(false);

  const handleImportExternalSite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let target = importUrlInput.trim();
    if (!target) {
      toast.error("Por favor, digite uma URL válida.");
      return;
    }
    if (onInspectExternalSite) {
      setIsImportModalOpen(false);
      onInspectExternalSite(target);
    } else {
      try {
        setIsImportingUrl(true);
        toast.info(`Buscando HTML de ${target}...`);

        const res = await fetch("/api/fetch-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: target }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Falha ao carregar o site");
        }

        if (onCodeChange) {
          onCodeChange(data.html);
        }
        setIsInspectMode(true);
        setIsCollapsed(false);
        setIsImportModalOpen(false);
        toast.success(`Site ${data.url} carregado! Clique em qualquer elemento para inspecionar.`);
      } catch (err: any) {
        toast.error(err.message || "Não foi possível carregar a URL fornecida.");
      } finally {
        setIsImportingUrl(false);
      }
    }
  };

  useEffect(() => {
    if (isInspectMode && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [isInspectMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startY = e.clientY;
    const startHeight = isCollapsed ? 46 : inspectorHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaY = startY - moveEvent.clientY;
      const newHeight = startHeight + deltaY;
      if (newHeight < 60) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
        const maxHeight = Math.max(300, window.innerHeight - 80);
        setInspectorHeight(Math.max(140, Math.min(maxHeight, newHeight)));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Box Model States
  const [marginBox, setMarginBox] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [paddingBox, setPaddingBox] = useState({ top: 0, right: 0, bottom: 0, left: 0 });

  // Figma Auto Layout & Box Model States
  const [isPaddingLinked, setIsPaddingLinked] = useState(false);
  const [isMarginLinked, setIsMarginLinked] = useState(false);
  const [borderWidth, setBorderWidth] = useState("1px");
  const [borderColor, setBorderColor] = useState("#3f3f46");
  const [borderStyle, setBorderStyle] = useState("solid");
  const [gapValue, setGapValue] = useState("0px");
  const [elemWidth, setElemWidth] = useState("auto");
  const [elemHeight, setElemHeight] = useState("auto");
  const [flexDir, setFlexDir] = useState("row");
  const [justifyContentVal, setJustifyContentVal] = useState("flex-start");
  const [alignItemsVal, setAlignItemsVal] = useState("stretch");

  // Quick edit local states
  const [editText, setEditText] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [editClasses, setEditClasses] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");

  // Style edit states
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [fontWeight, setFontWeight] = useState("400");
  const [lineHeight, setLineHeight] = useState("normal");
  const [letterSpacing, setLetterSpacing] = useState("normal");
  const [textTransform, setTextTransform] = useState("none");
  const [fontStyle, setFontStyle] = useState("normal");
  const [textDecoration, setTextDecoration] = useState("none");
  const [padding, setPadding] = useState("");
  const [margin, setMargin] = useState("");
  const [display, setDisplay] = useState("block");
  const [borderRadius, setBorderRadius] = useState("");
  const [textAlign, setTextAlign] = useState("left");
  const [customStyle, setCustomStyle] = useState("");
  const [isFontsModalOpen, setIsFontsModalOpen] = useState(false);

  // Add Child state
  const [newTagToAdd, setNewTagToAdd] = useState("button");
  const [newTagText, setNewTagText] = useState("Click me");

  // Post message helper
  const sendIframeMessage = (msg: any) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, "*");
    }
  };

  // Keyboard Hotkeys Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + C
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setIsInspectMode(!isInspectMode);
      }
      if (e.key === "Escape" && isInspectMode) {
        setSelectedElement(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isInspectMode, setIsInspectMode]);

  // Listen to messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "INSPECTOR_ELEMENT_SELECTED") {
        const elData: SelectedElementData = data.data;
        setSelectedElement(elData);
        setEditText(elData.innerText);
        setEditHtml(elData.innerHTML);
        setEditClasses(elData.className);
        setCustomStyle(elData.styles.inlineStyle);

        if (elData.boxModel) {
          setMarginBox(elData.boxModel.margin);
          setPaddingBox(elData.boxModel.padding);
        }

        // Parse colors and properties
        if (elData.styles.color) setTextColor(rgbToHex(elData.styles.color));
        if (elData.styles.backgroundColor) setBgColor(rgbToHex(elData.styles.backgroundColor));
        if (elData.styles.fontSize) setFontSize(elData.styles.fontSize);
        if (elData.styles.fontFamily) setFontFamily(elData.styles.fontFamily.replace(/["']/g, ""));
        if (elData.styles.fontWeight) setFontWeight(elData.styles.fontWeight);
        if (elData.styles.lineHeight) setLineHeight(elData.styles.lineHeight);
        if (elData.styles.letterSpacing) setLetterSpacing(elData.styles.letterSpacing);
        if (elData.styles.textTransform) setTextTransform(elData.styles.textTransform);
        if (elData.styles.fontStyle) setFontStyle(elData.styles.fontStyle);
        if (elData.styles.textDecoration) setTextDecoration(elData.styles.textDecoration);
        if (elData.styles.padding) setPadding(elData.styles.padding);
        if (elData.styles.margin) setMargin(elData.styles.margin);
        if (elData.styles.display) setDisplay(elData.styles.display);
        if (elData.styles.borderRadius) setBorderRadius(elData.styles.borderRadius);
        if (elData.styles.textAlign) setTextAlign(elData.styles.textAlign);

        // Smart Auto-Tab Switching according to element archetype
        const tag = elData.tagName.toLowerCase();
        const textTags = [
          "p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "a", "button",
          "label", "li", "strong", "em", "b", "i", "small", "blockquote",
          "code", "caption", "th", "td", "figcaption"
        ];
        const attrTags = ["img", "input", "textarea", "select", "iframe", "video", "audio", "source"];
        const containerTags = ["div", "section", "main", "article", "header", "footer", "nav", "aside", "ul", "ol", "table", "tbody", "tr", "form"];

        if (textTags.includes(tag) || (elData.innerText && elData.innerText.trim().length > 0 && !containerTags.includes(tag))) {
          setActiveTab("props"); // Switch to Content & Typography editor
        } else if (attrTags.includes(tag) && (!elData.innerText || elData.innerText.trim().length === 0)) {
          setActiveTab("attrs"); // Switch to Attributes editor
        } else {
          setActiveTab("styles"); // Switch to Box & CSS Styles editor
        }
      } else if (data.type === "INSPECTOR_HTML_UPDATED") {
        if (!readOnly && onCodeChange && data.html && !externalSiteUrl) {
          updateCodeWithNewBodyHtml(data.html);
        }
      } else if (data.type === "INSPECTOR_DOM_TREE_RESPONSE") {
        setDomTree(data.tree);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [code, onCodeChange, readOnly]);

  // Sync mode changes to iframe
  useEffect(() => {
    sendIframeMessage({ type: "SET_INSPECT_MODE", enabled: isInspectMode });
    if (isInspectMode) {
      sendIframeMessage({ type: "GET_DOM_TREE" });
    }
  }, [isInspectMode]);

  // Helper to convert rgb(r,g,b) to hex
  const rgbToHex = (rgb: string) => {
    if (!rgb || rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)") return "#ffffff";
    if (rgb.startsWith("#")) return rgb;
    const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return "#000000";
    const r = parseInt(match[1]).toString(16).padStart(2, "0");
    const g = parseInt(match[2]).toString(16).padStart(2, "0");
    const b = parseInt(match[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  };

  // Replace HTML code cleanly
  const updateCodeWithNewBodyHtml = (newBodyInnerHtml: string) => {
    if (code.includes("<body") && code.includes("</body>")) {
      const updated = code.replace(/<body([^>]*)>([\s\S]*?)<\/body>/i, `<body$1>\n${newBodyInnerHtml}\n</body>`);
      onCodeChange?.(updated, { isIframeSelfUpdate: true });
    } else {
      onCodeChange?.(newBodyInnerHtml, { isIframeSelfUpdate: true });
    }
  };

  // Actions
  const handleSelectByTreeIndex = (idx?: number) => {
    if (idx === undefined) return;
    sendIframeMessage({ type: "SELECT_ELEMENT_BY_INDEX", index: idx });
  };

  const handleApplyBoxModel = (newMargin = marginBox, newPadding = paddingBox) => {
    if (!selectedElement) return;
    const clampedMargin = {
      top: clampMargin(newMargin.top),
      right: clampMargin(newMargin.right),
      bottom: clampMargin(newMargin.bottom),
      left: clampMargin(newMargin.left),
    };
    const clampedPadding = {
      top: clampPadding(newPadding.top),
      right: clampPadding(newPadding.right),
      bottom: clampPadding(newPadding.bottom),
      left: clampPadding(newPadding.left),
    };
    sendIframeMessage({
      type: "APPLY_BOX_MODEL",
      index: selectedElement.index,
      margin: clampedMargin,
      padding: clampedPadding,
    });
  };

  const handleUpdateText = () => {
    if (!selectedElement) return;
    sendIframeMessage({
      type: "UPDATE_ELEMENT_TEXT",
      index: selectedElement.index,
      text: editText,
    });
  };

  const handleUpdateClasses = (newClassString: string) => {
    if (!selectedElement) return;
    setEditClasses(newClassString);
    sendIframeMessage({
      type: "UPDATE_ELEMENT_CLASSES",
      index: selectedElement.index,
      classes: newClassString,
    });
  };

  const handleAddClass = () => {
    if (!newClass.trim() || !selectedElement) return;
    const classes = (editClasses + " " + newClass.trim()).trim();
    handleUpdateClasses(classes);
    setNewClass("");
  };

  const handleRemoveClass = (cls: string) => {
    if (!selectedElement) return;
    const classList = editClasses.split(/\s+/).filter((c) => c !== cls);
    handleUpdateClasses(classList.join(" "));
  };

  const handleUpdateStyleProperty = (property: string, value: string) => {
    if (!selectedElement) return;
    sendIframeMessage({
      type: "UPDATE_ELEMENT_STYLE",
      index: selectedElement.index,
      property,
      value,
    });
  };

  const handleCustomStyleUpdate = (styleString: string) => {
    if (!selectedElement) return;
    setCustomStyle(styleString);
    sendIframeMessage({
      type: "UPDATE_ELEMENT_STYLE",
      index: selectedElement.index,
      styleString,
    });
  };

  const handleApplyPreset = (styleString: string, extraClasses = "") => {
    if (!selectedElement) return;
    if (styleString) handleCustomStyleUpdate(styleString);
    if (extraClasses) {
      const combined = (editClasses + " " + extraClasses).trim();
      handleUpdateClasses(combined);
    }
  };

  const handleAddOrUpdateAttr = (name: string, value: string) => {
    if (!selectedElement || !name.trim()) return;
    sendIframeMessage({
      type: "UPDATE_ELEMENT_ATTRIBUTE",
      index: selectedElement.index,
      name: name.trim(),
      value,
    });
    setNewAttrKey("");
    setNewAttrValue("");
  };

  const handleRemoveAttr = (name: string) => {
    if (!selectedElement) return;
    sendIframeMessage({
      type: "UPDATE_ELEMENT_ATTRIBUTE",
      index: selectedElement.index,
      name,
      value: null,
    });
  };

  const handleDeleteElement = () => {
    if (!selectedElement) return;
    sendIframeMessage({
      type: "DELETE_ELEMENT",
      index: selectedElement.index,
    });
    setSelectedElement(null);
  };

  const handleDuplicateElement = () => {
    if (!selectedElement) return;
    sendIframeMessage({
      type: "DUPLICATE_ELEMENT",
      index: selectedElement.index,
    });
  };

  const handleMoveElement = (direction: "up" | "down") => {
    if (!selectedElement) return;
    sendIframeMessage({
      type: "MOVE_ELEMENT",
      index: selectedElement.index,
      direction,
    });
  };

  const handleInsertChild = () => {
    sendIframeMessage({
      type: "INSERT_CHILD_ELEMENT",
      index: selectedElement ? selectedElement.index : -1,
      tagName: newTagToAdd,
      text: newTagText,
    });
  };

  // Render DOM Tree node recursively
  const renderTreeNode = (node: DomTreeNode, depth = 0) => {
    if (node.type === "text") return null;
    const isSelected = selectedElement && selectedElement.index === node.index;

    return (
      <div key={`tree-node-${node.index}`} className="font-mono text-xs my-0.5">
        <div
          onClick={() => handleSelectByTreeIndex(node.index)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-semibold"
              : "hover:bg-zinc-800/80 text-zinc-300"
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <ChevronRight size={12} className="text-zinc-500 shrink-0" />
          <span className="text-blue-400">&lt;{node.tagName}</span>
          {node.id && <span className="text-amber-400">#{node.id}</span>}
          {node.className && (
            <span className="text-emerald-400 truncate max-w-[150px]">
              .{node.className.trim().split(/\s+/).join(".")}
            </span>
          )}
          <span className="text-blue-400">&gt;</span>
        </div>
        {node.children && node.children.length > 0 && (
          <div>{node.children.map((child) => renderTreeNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  // Color Swatches
  const colorSwatches = [
    { name: "Emerald", value: "#10b981" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Violet", value: "#8b5cf6" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Sky", value: "#0ea5e9" },
    { name: "Dark Velvet", value: "#09090b" },
    { name: "Pure White", value: "#ffffff" },
  ];

  // Presets
  const presets = [
    {
      title: "Awwwards Glass Card",
      desc: "Backdrop blur & glassmorphic border",
      style: "background: rgba(255,255,255,0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);",
    },
    {
      title: "Neon Glow Button",
      desc: "Emerald glow with crisp typography",
      style: "background: #059669; color: #ffffff; padding: 10px 24px; border-radius: 9999px; font-weight: 600; box-shadow: 0 0 20px rgba(16,185,129,0.5); border: none; cursor: pointer;",
    },
    {
      title: "Gradient Display Text",
      desc: "Vibrant blue to emerald linear gradient text",
      style: "background: linear-gradient(to right, #38bdf8, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;",
    },
    {
      title: "Cyberpunk Container",
      desc: "High-contrast dark panel with neon blue line",
      style: "background: #09090b; border: 1px solid #1e293b; border-left: 4px solid #3b82f6; border-radius: 12px; padding: 20px; color: #f8fafc;",
    },
  ];

  return (
    <>
      {/* Invisible overlay while dragging to prevent iframe from capturing mouse move events */}
      {isDragging && (
        <div className="fixed inset-0 z-[99999] cursor-row-resize select-none bg-transparent" />
      )}
      <div
        style={{ height: isCollapsed ? 46 : inspectorHeight }}
        className={`flex flex-col bg-zinc-950 border-t border-zinc-800/80 text-zinc-200 text-xs w-full shrink-0 shadow-2xl z-30 font-sans relative ${
          isDragging ? "transition-none select-none" : "transition-all duration-150 ease-out"
        }`}
      >
        {/* Top Resize Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={() => {
            if (isCollapsed) {
              setIsCollapsed(false);
              setInspectorHeight(320);
            } else {
              setInspectorHeight((prev) => (prev > 350 ? 240 : 420));
            }
          }}
          className="h-2.5 w-full bg-zinc-900 hover:bg-emerald-500/80 active:bg-emerald-500 cursor-row-resize flex items-center justify-center transition-colors group select-none shrink-0"
          title="Arraste para redimensionar ou clique duplo para expandir/restaurar"
        >
          <div className="w-16 h-1 bg-zinc-700 group-hover:bg-white rounded-full transition-colors" />
        </div>

      {/* Top Inspector Header Bar */}
      <div className="h-9 px-3 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between shrink-0 gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={isInspectMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const next = !isInspectMode;
              setIsInspectMode(next);
              if (next) {
                setIsCollapsed(false);
                sendIframeMessage({ type: "GET_DOM_TREE" });
              }
            }}
            className={`h-6 px-2 text-xs rounded-lg gap-1.5 font-medium transition-all ${
              isInspectMode
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm border-emerald-500"
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
            }`}
          >
            <MousePointer size={12} className={isInspectMode ? "animate-pulse text-white" : ""} />
            {isInspectMode ? "Inspecting" : "Inspect Element"}
          </Button>

          {externalSiteUrl ? (
            <div className="flex items-center gap-1.5 bg-cyan-950/90 px-2 py-0.5 rounded-lg border border-cyan-800 text-cyan-200 text-[11px] shrink-0 font-mono">
              <Globe size={12} className="text-cyan-400 shrink-0 animate-pulse" />
              <span className="font-medium truncate max-w-[160px]">{externalSiteUrl}</span>
              {onClearExternalSite && (
                <button
                  type="button"
                  onClick={onClearExternalSite}
                  className="ml-1 text-cyan-300 hover:text-white text-[10px] font-sans bg-cyan-900/80 px-1.5 py-0.5 rounded border border-cyan-700 hover:bg-cyan-800 transition-colors"
                  title="Voltar ao preview do código local"
                >
                  Voltar ao Código
                </button>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="h-6 px-2 text-xs rounded-lg gap-1.5 font-medium bg-cyan-950/40 border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition-all shadow-sm"
              title="Inspecionar website externo por URL"
            >
              <Globe size={12} className="text-cyan-400" />
              <span className="hidden xs:inline">Inspecionar</span> Site
            </Button>
          )}

          {selectedElement ? (
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800/80 font-mono text-zinc-300 shadow-inner text-[11px]">
              <span className="text-blue-400 font-bold">&lt;{selectedElement.tagName}&gt;</span>
              {selectedElement.id && <span className="text-amber-400">#{selectedElement.id}</span>}
              {selectedElement.className && (
                <span className="text-emerald-400 truncate max-w-[100px]">
                  .{selectedElement.className.trim().split(/\s+/)[0]}
                </span>
              )}
              <span className="text-zinc-500 text-[10px]">
                ({selectedElement.rect.width}×{selectedElement.rect.height}px)
              </span>
            </div>
          ) : (
            <span className="text-zinc-500 text-[11px] italic hidden sm:inline">
              {externalSiteUrl ? "Clique em qualquer elemento do site para inspecionar" : "Clique em qualquer elemento no preview para inspecionar"}
            </span>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-0.5 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800/80 shrink-0">
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab("props");
              sendIframeMessage({ type: "GET_DOM_TREE" });
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
              activeTab === "props" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Type size={12} /> Content
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab("box");
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
              activeTab === "box" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layout size={12} className="text-cyan-400" /> Figma Layout
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab("styles");
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
              activeTab === "styles" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Palette size={12} /> Styles
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab("presets");
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
              activeTab === "presets" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Wand2 size={12} className="text-emerald-400" /> Presets
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab("attrs");
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
              activeTab === "attrs" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Tag size={12} /> Attrs
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab("tree");
              sendIframeMessage({ type: "GET_DOM_TREE" });
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
              activeTab === "tree" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers size={12} /> DOM Tree
          </button>
        </div>

        {/* Action Controls for Selected Element & Collapse/Close */}
        <div className="flex items-center gap-1 border-l border-zinc-800/80 pl-2 shrink-0">
          {selectedElement && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => handleMoveElement("up")}
                title="Move element up"
              >
                <ArrowUp size={12} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => handleMoveElement("down")}
                title="Move element down"
              >
                <ArrowDown size={12} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={handleDuplicateElement}
                title="Duplicate element"
              >
                <Copy size={12} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded text-red-400 hover:text-red-300 hover:bg-red-950/50"
                onClick={handleDeleteElement}
                title="Delete element"
              >
                <Trash2 size={12} />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expandir / Subir Inspetor" : "Abaixar / Minimizar Inspetor"}
          >
            {isCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded text-zinc-400 hover:text-red-400 hover:bg-red-950/40"
            onClick={() => {
              setIsInspectMode(false);
              setIsCollapsed(true);
            }}
            title="Fechar Inspetor"
          >
            <X size={13} />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* DOM Ancestry Breadcrumb Trail Bar */}
          {selectedElement && selectedElement.breadcrumbs && selectedElement.breadcrumbs.length > 0 && (
            <div className="h-6 px-3 bg-zinc-950 border-b border-zinc-800/50 flex items-center gap-1 font-mono text-[11px] text-zinc-400 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-zinc-600 font-sans text-[10px] uppercase font-semibold mr-1">Ancestry:</span>
              {selectedElement.breadcrumbs.map((bc, idx) => (
                <React.Fragment key={`bc-${idx}`}>
                  <button
                    onClick={() => handleSelectByTreeIndex(bc.index)}
                    className={`hover:text-emerald-300 transition-colors flex items-center gap-0.5 px-1 rounded ${
                      bc.index === selectedElement.index ? "text-emerald-400 font-bold bg-emerald-950/60" : "text-zinc-400"
                    }`}
                  >
                    <span>{bc.tagName}</span>
                    {bc.id && <span className="text-amber-400">#{bc.id}</span>}
                  </button>
                  {idx < selectedElement.breadcrumbs.length - 1 && <span className="text-zinc-700">›</span>}
                </React.Fragment>
              ))}
            </div>
          )}

      {/* Main Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-950/80 custom-scrollbar">
        {!selectedElement && activeTab !== "tree" ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-6 space-y-2">
            <MousePointer size={24} className="animate-bounce text-emerald-500/80" />
            <p className="text-xs font-semibold text-zinc-300">Awwwards Live Element Inspector Ready</p>
            <p className="text-[11px] text-zinc-500 max-w-sm text-center">
              Click any element in the live canvas to tweak inner text, Box Model (margin/padding), CSS classes, color swatches, or apply Glassmorphic presets.
            </p>
          </div>
        ) : activeTab === "box" && selectedElement ? (
          /* Figma-Inspired Auto Layout & Box Inspector */
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                  F
                </div>
                <Label className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                  Figma Auto Layout & Canvas Spacing
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={() => handleApplyBoxModel()}
                  className="h-6 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium shadow-sm gap-1"
                >
                  <Check size={11} /> Save Spacing
                </Button>
              </div>
            </div>

            {/* Figma Quick Padding Scale Presets */}
            <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-medium flex items-center gap-1 text-zinc-300">
                  <Sliders size={12} className="text-cyan-400" /> Figma Spacing Scale Presets
                </span>
                <span className="text-[10px] text-zinc-500">Quick apply padding</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[0, 4, 8, 12, 16, 24, 32, 48, 64].map((px) => (
                  <button
                    key={`p-preset-${px}`}
                    onClick={() => {
                      const next = { top: px, right: px, bottom: px, left: px };
                      setPaddingBox(next);
                      handleApplyBoxModel(marginBox, next);
                    }}
                    className="px-2 py-1 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 text-cyan-300 font-mono text-[11px] transition-all"
                  >
                    {px}px
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Figma Box Diagram Canvas */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Subtle Canvas Dot Pattern Background */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
                  backgroundSize: "12px 12px",
                }}
              />

              {/* Outer Margin Box (Amber) */}
              <div className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-3 w-full max-w-lg text-center relative shadow-inner transition-all">
                <div className="absolute top-1 left-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                    MARGIN
                  </span>
                  <button
                    onClick={() => setIsMarginLinked(!isMarginLinked)}
                    className="text-amber-500 hover:text-amber-300 p-0.5 rounded transition-colors"
                    title={isMarginLinked ? "Unlink margins" : "Link margins (uniform)"}
                  >
                    {isMarginLinked ? <Lock size={11} /> : <Unlock size={11} />}
                  </button>
                </div>

                {/* Top Margin Input */}
                <div className="flex justify-center mb-1.5">
                  <Input
                    type="number"
                    min={MIN_MARGIN}
                    max={MAX_MARGIN}
                    value={marginBox.top}
                    onChange={(e) => {
                      const raw = parseInt(e.target.value);
                      const val = clampMargin(isNaN(raw) ? 0 : raw);
                      const next = isMarginLinked
                        ? { top: val, right: val, bottom: val, left: val }
                        : { ...marginBox, top: val };
                      setMarginBox(next);
                      handleApplyBoxModel(next, paddingBox);
                    }}
                    className="w-16 h-6 text-center text-xs font-mono bg-zinc-950 border-amber-800/80 text-amber-300 p-0 rounded shadow-sm focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  {/* Left Margin Input */}
                  <Input
                    type="number"
                    min={MIN_MARGIN}
                    max={MAX_MARGIN}
                    value={marginBox.left}
                    onChange={(e) => {
                      const raw = parseInt(e.target.value);
                      const val = clampMargin(isNaN(raw) ? 0 : raw);
                      const next = isMarginLinked
                        ? { top: val, right: val, bottom: val, left: val }
                        : { ...marginBox, left: val };
                      setMarginBox(next);
                      handleApplyBoxModel(next, paddingBox);
                    }}
                    className="w-16 h-6 text-center text-xs font-mono bg-zinc-950 border-amber-800/80 text-amber-300 p-0 rounded shrink-0 shadow-sm focus:border-amber-500"
                  />

                  {/* Middle Border / Stroke Box (Yellow) */}
                  <div className="bg-yellow-950/20 border border-yellow-500/40 rounded-lg p-2.5 flex-1 relative">
                    <div className="absolute top-1 left-2 text-[9px] font-mono font-bold text-yellow-400 uppercase">
                      BORDER STROKE
                    </div>

                    {/* Inner Padding Box (Cyan / Blue) */}
                    <div className="bg-cyan-950/30 border border-cyan-500/50 rounded-md p-2.5 my-3 relative">
                      <div className="absolute top-1 left-2 flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                          PADDING
                        </span>
                        <button
                          onClick={() => setIsPaddingLinked(!isPaddingLinked)}
                          className="text-cyan-400 hover:text-cyan-200 p-0.5 rounded transition-colors"
                          title={isPaddingLinked ? "Unlink padding" : "Link padding (uniform)"}
                        >
                          {isPaddingLinked ? <Lock size={10} /> : <Unlock size={10} />}
                        </button>
                      </div>

                      {/* Top Padding Input */}
                      <div className="flex justify-center mb-1">
                        <Input
                          type="number"
                          min={MIN_PADDING}
                          max={MAX_PADDING}
                          value={paddingBox.top}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value);
                            const val = clampPadding(isNaN(raw) ? 0 : raw);
                            const next = isPaddingLinked
                              ? { top: val, right: val, bottom: val, left: val }
                              : { ...paddingBox, top: val };
                            setPaddingBox(next);
                            handleApplyBoxModel(marginBox, next);
                          }}
                          className="w-16 h-6 text-center text-xs font-mono bg-zinc-950 border-cyan-800/80 text-cyan-300 p-0 rounded shadow-sm focus:border-cyan-400"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        {/* Left Padding Input */}
                        <Input
                          type="number"
                          min={MIN_PADDING}
                          max={MAX_PADDING}
                          value={paddingBox.left}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value);
                            const val = clampPadding(isNaN(raw) ? 0 : raw);
                            const next = isPaddingLinked
                              ? { top: val, right: val, bottom: val, left: val }
                              : { ...paddingBox, left: val };
                            setPaddingBox(next);
                            handleApplyBoxModel(marginBox, next);
                          }}
                          className="w-16 h-6 text-center text-xs font-mono bg-zinc-950 border-cyan-800/80 text-cyan-300 p-0 rounded shrink-0 shadow-sm focus:border-cyan-400"
                        />

                        {/* Content Center Dimensions */}
                        <div className="bg-violet-950/60 border border-violet-500/70 rounded-md px-3 py-2 text-center text-xs font-mono font-bold text-violet-200 flex-1 my-1 shadow-md">
                          <span className="text-[10px] text-violet-400 block font-sans">CONTENT</span>
                          {selectedElement.rect.width} × {selectedElement.rect.height} px
                        </div>

                        {/* Right Padding Input */}
                        <Input
                          type="number"
                          min={MIN_PADDING}
                          max={MAX_PADDING}
                          value={paddingBox.right}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value);
                            const val = clampPadding(isNaN(raw) ? 0 : raw);
                            const next = isPaddingLinked
                              ? { top: val, right: val, bottom: val, left: val }
                              : { ...paddingBox, right: val };
                            setPaddingBox(next);
                            handleApplyBoxModel(marginBox, next);
                          }}
                          className="w-16 h-6 text-center text-xs font-mono bg-zinc-950 border-cyan-800/80 text-cyan-300 p-0 rounded shrink-0 shadow-sm focus:border-cyan-400"
                        />
                      </div>

                      {/* Bottom Padding Input */}
                      <div className="flex justify-center mt-1">
                        <Input
                          type="number"
                          min={MIN_PADDING}
                          max={MAX_PADDING}
                          value={paddingBox.bottom}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value);
                            const val = clampPadding(isNaN(raw) ? 0 : raw);
                            const next = isPaddingLinked
                              ? { top: val, right: val, bottom: val, left: val }
                              : { ...paddingBox, bottom: val };
                            setPaddingBox(next);
                            handleApplyBoxModel(marginBox, next);
                          }}
                          className="w-16 h-6 text-center text-xs font-mono bg-zinc-950 border-cyan-800/80 text-cyan-300 p-0 rounded shadow-sm focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Margin Input */}
                  <Input
                    type="number"
                    min={MIN_MARGIN}
                    max={MAX_MARGIN}
                    value={marginBox.right}
                    onChange={(e) => {
                      const raw = parseInt(e.target.value);
                      const val = clampMargin(isNaN(raw) ? 0 : raw);
                      const next = isMarginLinked
                        ? { top: val, right: val, bottom: val, left: val }
                        : { ...marginBox, right: val };
                      setMarginBox(next);
                      handleApplyBoxModel(next, paddingBox);
                    }}
                    className="w-16 h-6 text-center text-xs font-mono bg-zinc-950 border-amber-800/80 text-amber-300 p-0 rounded shrink-0 shadow-sm focus:border-amber-500"
                  />
                </div>

                {/* Bottom Margin Input */}
                <div className="flex justify-center mt-1.5">
                  <Input
                    type="number"
                    min={MIN_MARGIN}
                    max={MAX_MARGIN}
                    value={marginBox.bottom}
                    onChange={(e) => {
                      const raw = parseInt(e.target.value);
                      const val = clampMargin(isNaN(raw) ? 0 : raw);
                      const next = isMarginLinked
                        ? { top: val, right: val, bottom: val, left: val }
                        : { ...marginBox, bottom: val };
                      setMarginBox(next);
                      handleApplyBoxModel(next, paddingBox);
                    }}
                    className="w-16 h-6 text-center text-xs font-mono bg-zinc-950 border-amber-800/80 text-amber-300 p-0 rounded shadow-sm focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Figma Auto-Layout & 3x3 Alignment Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Auto Layout Matrix */}
              <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800/80 space-y-2">
                <Label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                  <Grid size={13} className="text-violet-400" /> Figma Alignment Grid (3×3)
                </Label>

                {/* 3x3 Alignment Buttons */}
                <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-2 rounded-lg border border-zinc-800 max-w-[180px] mx-auto">
                  {[
                    { label: "TL", justify: "flex-start", align: "flex-start" },
                    { label: "TC", justify: "center", align: "flex-start" },
                    { label: "TR", justify: "flex-end", align: "flex-start" },
                    { label: "CL", justify: "flex-start", align: "center" },
                    { label: "C", justify: "center", align: "center" },
                    { label: "CR", justify: "flex-end", align: "center" },
                    { label: "BL", justify: "flex-start", align: "flex-end" },
                    { label: "BC", justify: "center", align: "flex-end" },
                    { label: "BR", justify: "flex-end", align: "flex-end" },
                  ].map((pos, idx) => {
                    const isActive =
                      justifyContentVal === pos.justify && alignItemsVal === pos.align;
                    return (
                      <button
                        key={`align-mat-${idx}`}
                        onClick={() => {
                          setJustifyContentVal(pos.justify);
                          setAlignItemsVal(pos.align);
                          handleUpdateStyleProperty("display", "flex");
                          handleUpdateStyleProperty("justifyContent", pos.justify);
                          handleUpdateStyleProperty("alignItems", pos.align);
                        }}
                        className={`h-8 rounded flex items-center justify-center text-[10px] font-mono transition-all ${
                          isActive
                            ? "bg-violet-600 text-white font-bold shadow-md ring-1 ring-violet-400"
                            : "bg-zinc-900 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                        }`}
                        title={`Align: ${pos.label}`}
                      >
                        {pos.label}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Alignment Toggles */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      setJustifyContentVal("space-between");
                      handleUpdateStyleProperty("display", "flex");
                      handleUpdateStyleProperty("justifyContent", "space-between");
                    }}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-medium border transition-all ${
                      justifyContentVal === "space-between"
                        ? "bg-violet-950 text-violet-300 border-violet-700"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    Space-Between
                  </button>
                  <button
                    onClick={() => {
                      setJustifyContentVal("space-around");
                      handleUpdateStyleProperty("display", "flex");
                      handleUpdateStyleProperty("justifyContent", "space-around");
                    }}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-medium border transition-all ${
                      justifyContentVal === "space-around"
                        ? "bg-violet-950 text-violet-300 border-violet-700"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    Space-Around
                  </button>
                </div>
              </div>

              {/* Figma Layout & Gap Controls */}
              <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800/80 space-y-2.5">
                <Label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                  <Layout size={13} className="text-emerald-400" /> Direction & Gap
                </Label>

                {/* Direction Buttons */}
                <div>
                  <span className="text-[10px] text-zinc-400 mb-1 block">Direction</span>
                  <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800 gap-1">
                    {[
                      { name: "Row", val: "row" },
                      { name: "Column", val: "column" },
                      { name: "Block", val: "block" },
                      { name: "Grid", val: "grid" },
                    ].map((d) => (
                      <button
                        key={d.val}
                        onClick={() => {
                          setFlexDir(d.val);
                          if (d.val === "block") {
                            setDisplay("block");
                            handleUpdateStyleProperty("display", "block");
                          } else if (d.val === "grid") {
                            setDisplay("grid");
                            handleUpdateStyleProperty("display", "grid");
                          } else {
                            setDisplay("flex");
                            handleUpdateStyleProperty("display", "flex");
                            handleUpdateStyleProperty("flexDirection", d.val);
                          }
                        }}
                        className={`flex-1 py-1 text-[11px] font-medium rounded ${
                          flexDir === d.val
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gap Input */}
                <div>
                  <span className="text-[10px] text-zinc-400 mb-1 block">Gap (Spacing Between)</span>
                  <div className="flex gap-1.5 items-center">
                    <Input
                      value={gapValue}
                      onChange={(e) => {
                        setGapValue(e.target.value);
                        handleUpdateStyleProperty("gap", e.target.value);
                      }}
                      placeholder="16px"
                      className="h-7 bg-zinc-950 border-zinc-800 text-xs font-mono rounded-lg flex-1"
                    />
                    {["0px", "8px", "16px", "24px"].map((g) => (
                      <button
                        key={`gap-${g}`}
                        onClick={() => {
                          setGapValue(g);
                          handleUpdateStyleProperty("gap", g);
                        }}
                        className="px-2 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-emerald-300 font-mono rounded-lg"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dimensions & Resizing Modes */}
            <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800/80 space-y-2">
              <Label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                <Scaling size={13} className="text-pink-400" /> Resizing & Dimensions
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Width */}
                <div>
                  <span className="text-[10px] text-zinc-400 mb-1 block">Width</span>
                  <Input
                    value={elemWidth}
                    onChange={(e) => {
                      setElemWidth(e.target.value);
                      handleUpdateStyleProperty("width", e.target.value);
                    }}
                    placeholder="100% / auto / 300px"
                    className="h-7 bg-zinc-950 border-zinc-800 text-xs font-mono rounded-lg"
                  />
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => {
                        setElemWidth("100%");
                        handleUpdateStyleProperty("width", "100%");
                      }}
                      className="flex-1 py-0.5 text-[9px] bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 rounded"
                    >
                      Fill
                    </button>
                    <button
                      onClick={() => {
                        setElemWidth("fit-content");
                        handleUpdateStyleProperty("width", "fit-content");
                      }}
                      className="flex-1 py-0.5 text-[9px] bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 rounded"
                    >
                      Hug
                    </button>
                  </div>
                </div>

                {/* Height */}
                <div>
                  <span className="text-[10px] text-zinc-400 mb-1 block">Height</span>
                  <Input
                    value={elemHeight}
                    onChange={(e) => {
                      setElemHeight(e.target.value);
                      handleUpdateStyleProperty("height", e.target.value);
                    }}
                    placeholder="auto / 200px"
                    className="h-7 bg-zinc-950 border-zinc-800 text-xs font-mono rounded-lg"
                  />
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => {
                        setElemHeight("100%");
                        handleUpdateStyleProperty("height", "100%");
                      }}
                      className="flex-1 py-0.5 text-[9px] bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 rounded"
                    >
                      Fill
                    </button>
                    <button
                      onClick={() => {
                        setElemHeight("auto");
                        handleUpdateStyleProperty("height", "auto");
                      }}
                      className="flex-1 py-0.5 text-[9px] bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 rounded"
                    >
                      Hug
                    </button>
                  </div>
                </div>

                {/* Corner Radius */}
                <div>
                  <span className="text-[10px] text-zinc-400 mb-1 block">Corner Radius</span>
                  <Input
                    value={borderRadius}
                    onChange={(e) => {
                      setBorderRadius(e.target.value);
                      handleUpdateStyleProperty("borderRadius", e.target.value);
                    }}
                    placeholder="12px / 9999px"
                    className="h-7 bg-zinc-950 border-zinc-800 text-xs font-mono rounded-lg"
                  />
                  <div className="flex gap-1 mt-1">
                    {["0px", "8px", "16px", "9999px"].map((r) => (
                      <button
                        key={`rad-${r}`}
                        onClick={() => {
                          setBorderRadius(r);
                          handleUpdateStyleProperty("borderRadius", r);
                        }}
                        className="flex-1 py-0.5 text-[9px] bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 rounded"
                      >
                        {r === "9999px" ? "Pill" : r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Stroke Color & Width */}
                <div>
                  <span className="text-[10px] text-zinc-400 mb-1 block">Border Stroke</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => {
                        setBorderColor(e.target.value);
                        handleUpdateStyleProperty("borderColor", e.target.value);
                        handleUpdateStyleProperty("borderStyle", "solid");
                      }}
                      className="w-6 h-6 rounded border-none bg-transparent cursor-pointer shrink-0"
                    />
                    <Input
                      value={borderWidth}
                      onChange={(e) => {
                        setBorderWidth(e.target.value);
                        handleUpdateStyleProperty("borderWidth", e.target.value);
                        handleUpdateStyleProperty("borderStyle", "solid");
                      }}
                      placeholder="1px"
                      className="h-7 bg-zinc-950 border-zinc-800 text-xs font-mono rounded-lg flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "presets" && selectedElement ? (
          /* Awwwards Presets Gallery */
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Wand2 size={14} /> One-Click Awwwards Aesthetic Presets
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presets.map((p, idx) => (
                <div
                  key={`preset-${idx}`}
                  className="bg-zinc-900 p-3 rounded-xl border border-zinc-800/80 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div>
                    <h5 className="font-semibold text-zinc-100 text-xs flex items-center justify-between">
                      {p.title}
                      <Sparkles size={12} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    </h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{p.desc}</p>
                  </div>
                  <Button
                    onClick={() => handleApplyPreset(p.style)}
                    className="w-full h-7 bg-zinc-800 hover:bg-emerald-600 text-white text-xs rounded-lg font-medium transition-colors"
                  >
                    Apply Preset Style
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === "props" && selectedElement ? (
          <div className="space-y-3">
            {/* Top row: Inner Text Editor + Quick Child Adder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Text Content Editor */}
              <div className="space-y-2 bg-zinc-900 p-3 rounded-xl border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300 font-medium flex items-center gap-1.5 text-xs">
                    <Type size={13} className="text-blue-400" /> Inner Text Content
                  </Label>
                  <Button
                    size="sm"
                    onClick={handleUpdateText}
                    className="h-6 px-2 text-[11px] bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                  >
                    <Check size={11} className="mr-1" /> Apply Text
                  </Button>
                </div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Element inner text content..."
                  className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Add Child Element */}
              <div className="space-y-2 bg-zinc-900 p-3 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
                <div>
                  <Label className="text-zinc-300 font-medium flex items-center gap-1.5 text-xs mb-2">
                    <Plus size={13} className="text-emerald-400" /> Add Child Element
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-zinc-500">Tag Type</Label>
                      <select
                        value={newTagToAdd}
                        onChange={(e) => setNewTagToAdd(e.target.value)}
                        className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-200 focus:outline-none"
                      >
                        <option value="button">Button (&lt;button&gt;)</option>
                        <option value="p">Paragraph (&lt;p&gt;)</option>
                        <option value="h2">Heading (&lt;h2&gt;)</option>
                        <option value="div">Container (&lt;div&gt;)</option>
                        <option value="span">Span (&lt;span&gt;)</option>
                        <option value="a">Link (&lt;a&gt;)</option>
                        <option value="input">Input (&lt;input&gt;)</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-[10px] text-zinc-500">Initial Text</Label>
                      <Input
                        value={newTagText}
                        onChange={(e) => setNewTagText(e.target.value)}
                        className="h-7 bg-zinc-950 border-zinc-800 text-xs rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleInsertChild}
                  className="w-full h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg mt-1 font-medium"
                >
                  <Plus size={13} className="mr-1.5" /> Append inside &lt;{selectedElement.tagName}&gt;
                </Button>
              </div>
            </div>

            {/* Comprehensive Typography & Font Family Formatting Panel */}
            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                <Label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Baseline size={14} /> Smart Typography & Font Formatting
                </Label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  &lt;{selectedElement.tagName}&gt; styles
                </span>
              </div>

              {/* Row 1: Font Family, Font Size & Font Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Font Family Selector */}
                <div className="sm:col-span-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] text-zinc-400 block">Font Family</Label>
                    <button
                      type="button"
                      onClick={() => setIsFontsModalOpen(true)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Type size={11} /> Explore Google Fonts
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <select
                      value={fontFamily}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFontFamily(val);
                        handleUpdateStyleProperty("fontFamily", val);
                      }}
                      className="flex-1 h-7 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    >
                      <optgroup label="Popular Modern Sans (Google)">
                        <option value="Inter, sans-serif">Inter</option>
                        <option value="Roboto, sans-serif">Roboto</option>
                        <option value="'Open Sans', sans-serif">Open Sans</option>
                        <option value="Montserrat, sans-serif">Montserrat</option>
                        <option value="Poppins, sans-serif">Poppins</option>
                        <option value="Lato, sans-serif">Lato</option>
                        <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                        <option value="Nunito, sans-serif">Nunito</option>
                        <option value="Raleway, sans-serif">Raleway</option>
                        <option value="Ubuntu, sans-serif">Ubuntu</option>
                        <option value="'Work Sans', sans-serif">Work Sans</option>
                        <option value="'DM Sans', sans-serif">DM Sans</option>
                        <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                        <option value="Syne, sans-serif">Syne</option>
                        <option value="Oswald, sans-serif">Oswald</option>
                        <option value="system-ui, -apple-system, sans-serif">System Sans-Serif</option>
                      </optgroup>
                      <optgroup label="Serif & Editorial (Google)">
                        <option value="'Playfair Display', serif">Playfair Display</option>
                        <option value="Merriweather, serif">Merriweather</option>
                        <option value="Lora, serif">Lora</option>
                        <option value="'PT Serif', serif">PT Serif</option>
                        <option value="'Cormorant Garamond', serif">Cormorant Garamond</option>
                        <option value="Cinzel, serif">Cinzel</option>
                        <option value="Georgia, serif">Georgia</option>
                      </optgroup>
                      <optgroup label="Code & Monospace (Google)">
                        <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                        <option value="'Fira Code', monospace">Fira Code</option>
                        <option value="'Roboto Mono', monospace">Roboto Mono</option>
                        <option value="'Source Code Pro', monospace">Source Code Pro</option>
                        <option value="'Space Mono', monospace">Space Mono</option>
                        <option value="ui-monospace, SFMono-Regular, Consolas, monospace">System Monospace</option>
                      </optgroup>
                      <optgroup label="Display & Creative (Google)">
                        <option value="'Bebas Neue', sans-serif">Bebas Neue</option>
                        <option value="Pacifico, cursive">Pacifico</option>
                        <option value="Caveat, cursive">Caveat</option>
                        <option value="'Dancing Script', cursive">Dancing Script</option>
                        <option value="Lobster, cursive">Lobster</option>
                        <option value="'Press Start 2P', display">Press Start 2P (8-Bit)</option>
                      </optgroup>
                    </select>
                    <Input
                      value={fontFamily}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFontFamily(val);
                        handleUpdateStyleProperty("fontFamily", val);
                      }}
                      placeholder="Custom font..."
                      className="w-32 h-7 bg-zinc-950 border-zinc-800 text-xs font-mono rounded-lg"
                    />
                  </div>
                </div>

                {/* Font Size */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-zinc-400 block">Font Size</Label>
                  <Input
                    value={fontSize}
                    onChange={(e) => {
                      setFontSize(e.target.value);
                      handleUpdateStyleProperty("fontSize", e.target.value);
                    }}
                    placeholder="16px"
                    className="h-7 bg-zinc-950 border-zinc-800 text-xs rounded-lg"
                  />
                </div>

                {/* Font Weight */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-zinc-400 block">Font Weight</Label>
                  <select
                    value={fontWeight}
                    onChange={(e) => {
                      setFontWeight(e.target.value);
                      handleUpdateStyleProperty("fontWeight", e.target.value);
                    }}
                    className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra Bold (800)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>
              </div>

              {/* Quick Font Size Presets */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-zinc-500 shrink-0 font-medium mr-1">Quick Size:</span>
                {["12px", "14px", "16px", "18px", "20px", "24px", "32px", "48px"].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => {
                      setFontSize(sz);
                      handleUpdateStyleProperty("fontSize", sz);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 transition-colors ${
                      fontSize === sz
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              {/* Row 2: Line Height, Letter Spacing, Case, Align, Format & Color */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                {/* Line Height */}
                <div>
                  <Label className="text-[11px] text-zinc-400 mb-1 block">Line Height</Label>
                  <select
                    value={lineHeight}
                    onChange={(e) => {
                      setLineHeight(e.target.value);
                      handleUpdateStyleProperty("lineHeight", e.target.value);
                    }}
                    className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="1">1 (Tight)</option>
                    <option value="1.25">1.25 (Snug)</option>
                    <option value="1.5">1.5 (Relaxed)</option>
                    <option value="1.75">1.75 (Wide)</option>
                    <option value="2">2 (Double)</option>
                  </select>
                </div>

                {/* Letter Spacing */}
                <div>
                  <Label className="text-[11px] text-zinc-400 mb-1 block">Tracking</Label>
                  <select
                    value={letterSpacing}
                    onChange={(e) => {
                      setLetterSpacing(e.target.value);
                      handleUpdateStyleProperty("letterSpacing", e.target.value);
                    }}
                    className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="-0.05em">Tight (-0.05em)</option>
                    <option value="0.025em">Wide (0.025em)</option>
                    <option value="0.05em">Wider (0.05em)</option>
                    <option value="0.1em">Widest (0.1em)</option>
                  </select>
                </div>

                {/* Text Transform */}
                <div>
                  <Label className="text-[11px] text-zinc-400 mb-1 block">Case</Label>
                  <select
                    value={textTransform}
                    onChange={(e) => {
                      setTextTransform(e.target.value);
                      handleUpdateStyleProperty("textTransform", e.target.value);
                    }}
                    className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="none">None</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option>
                    <option value="capitalize">Capitalize</option>
                  </select>
                </div>

                {/* Alignment */}
                <div>
                  <Label className="text-[11px] text-zinc-400 mb-1 block">Alignment</Label>
                  <div className="flex bg-zinc-950 rounded-lg border border-zinc-800 p-0.5 gap-0.5">
                    {(["left", "center", "right", "justify"] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => {
                          setTextAlign(align);
                          handleUpdateStyleProperty("textAlign", align);
                        }}
                        className={`flex-1 h-6 flex items-center justify-center rounded text-xs transition-colors ${
                          textAlign === align ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {align === "left" && <AlignLeft size={11} />}
                        {align === "center" && <AlignCenter size={11} />}
                        {align === "right" && <AlignRight size={11} />}
                        {align === "justify" && <AlignJustify size={11} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format Toggles */}
                <div>
                  <Label className="text-[11px] text-zinc-400 mb-1 block">Format</Label>
                  <div className="flex bg-zinc-950 rounded-lg border border-zinc-800 p-0.5 gap-0.5">
                    <button
                      onClick={() => {
                        const next = fontWeight === "700" || fontWeight === "bold" ? "400" : "700";
                        setFontWeight(next);
                        handleUpdateStyleProperty("fontWeight", next);
                      }}
                      className={`flex-1 h-6 flex items-center justify-center rounded transition-colors ${
                        fontWeight === "700" || fontWeight === "bold" ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                      title="Bold"
                    >
                      <Bold size={11} />
                    </button>
                    <button
                      onClick={() => {
                        const next = fontStyle === "italic" ? "normal" : "italic";
                        setFontStyle(next);
                        handleUpdateStyleProperty("fontStyle", next);
                      }}
                      className={`flex-1 h-6 flex items-center justify-center rounded transition-colors ${
                        fontStyle === "italic" ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                      title="Italic"
                    >
                      <Italic size={11} />
                    </button>
                    <button
                      onClick={() => {
                        const next = textDecoration.includes("underline") ? "none" : "underline";
                        setTextDecoration(next);
                        handleUpdateStyleProperty("textDecoration", next);
                      }}
                      className={`flex-1 h-6 flex items-center justify-center rounded transition-colors ${
                        textDecoration.includes("underline") ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                      title="Underline"
                    >
                      <Underline size={11} />
                    </button>
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <Label className="text-[11px] text-zinc-400 mb-1 block">Text Color</Label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => {
                        setTextColor(e.target.value);
                        handleUpdateStyleProperty("color", e.target.value);
                      }}
                      className="w-6 h-6 rounded border-none bg-transparent cursor-pointer shrink-0"
                    />
                    <Input
                      value={textColor}
                      onChange={(e) => {
                        setTextColor(e.target.value);
                        handleUpdateStyleProperty("color", e.target.value);
                      }}
                      className="h-7 bg-zinc-950 border-zinc-800 text-[11px] font-mono uppercase rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "styles" && selectedElement ? (
          <div className="space-y-3">
            {/* Color Palette Swatches */}
            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800/80 space-y-2">
              <Label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                <Palette size={13} className="text-violet-400" /> Pro Palette Swatches
              </Label>
              <div className="flex items-center gap-2 flex-wrap">
                {colorSwatches.map((sw, idx) => (
                  <button
                    key={`sw-${idx}`}
                    onClick={() => {
                      setTextColor(sw.value);
                      handleUpdateStyleProperty("color", sw.value);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all text-[11px]"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: sw.value }}
                    />
                    <span className="text-zinc-300">{sw.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900 p-3 rounded-xl border border-zinc-800/80">
              {/* Text Color */}
              <div>
                <Label className="text-[11px] text-zinc-400 mb-1 block">Text Color</Label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => {
                      setTextColor(e.target.value);
                      handleUpdateStyleProperty("color", e.target.value);
                    }}
                    className="w-7 h-7 rounded border-none bg-transparent cursor-pointer shrink-0"
                  />
                  <Input
                    value={textColor}
                    onChange={(e) => {
                      setTextColor(e.target.value);
                      handleUpdateStyleProperty("color", e.target.value);
                    }}
                    className="h-7 bg-zinc-950 border-zinc-800 text-xs font-mono uppercase rounded"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <Label className="text-[11px] text-zinc-400 mb-1 block">Background</Label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => {
                      setBgColor(e.target.value);
                      handleUpdateStyleProperty("backgroundColor", e.target.value);
                    }}
                    className="w-7 h-7 rounded border-none bg-transparent cursor-pointer shrink-0"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => {
                      setBgColor(e.target.value);
                      handleUpdateStyleProperty("backgroundColor", e.target.value);
                    }}
                    className="h-7 bg-zinc-950 border-zinc-800 text-xs font-mono uppercase rounded"
                  />
                </div>
              </div>

              {/* Font Size */}
              <div>
                <Label className="text-[11px] text-zinc-400 mb-1 block">Font Size</Label>
                <Input
                  value={fontSize}
                  onChange={(e) => {
                    setFontSize(e.target.value);
                    handleUpdateStyleProperty("fontSize", e.target.value);
                  }}
                  placeholder="16px"
                  className="h-7 bg-zinc-950 border-zinc-800 text-xs rounded"
                />
              </div>

              {/* Display */}
              <div>
                <Label className="text-[11px] text-zinc-400 mb-1 block">Display</Label>
                <select
                  value={display}
                  onChange={(e) => {
                    setDisplay(e.target.value);
                    handleUpdateStyleProperty("display", e.target.value);
                  }}
                  className="w-full h-7 bg-zinc-950 border border-zinc-800 rounded px-2 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="block">block</option>
                  <option value="flex">flex</option>
                  <option value="inline-block">inline-block</option>
                  <option value="inline">inline</option>
                  <option value="grid">grid</option>
                  <option value="none">none</option>
                </select>
              </div>

              {/* Padding */}
              <div>
                <Label className="text-[11px] text-zinc-400 mb-1 block">Padding</Label>
                <Input
                  value={padding}
                  onChange={(e) => {
                    setPadding(e.target.value);
                    handleUpdateStyleProperty("padding", e.target.value);
                  }}
                  placeholder="8px 16px"
                  className="h-7 bg-zinc-950 border-zinc-800 text-xs rounded"
                />
              </div>

              {/* Margin */}
              <div>
                <Label className="text-[11px] text-zinc-400 mb-1 block">Margin</Label>
                <Input
                  value={margin}
                  onChange={(e) => {
                    setMargin(e.target.value);
                    handleUpdateStyleProperty("margin", e.target.value);
                  }}
                  placeholder="0px auto"
                  className="h-7 bg-zinc-950 border-zinc-800 text-xs rounded"
                />
              </div>

              {/* Border Radius */}
              <div>
                <Label className="text-[11px] text-zinc-400 mb-1 block">Border Radius</Label>
                <Input
                  value={borderRadius}
                  onChange={(e) => {
                    setBorderRadius(e.target.value);
                    handleUpdateStyleProperty("borderRadius", e.target.value);
                  }}
                  placeholder="8px"
                  className="h-7 bg-zinc-950 border-zinc-800 text-xs rounded"
                />
              </div>

              {/* Text Align */}
              <div>
                <Label className="text-[11px] text-zinc-400 mb-1 block">Text Alignment</Label>
                <div className="flex bg-zinc-950 rounded border border-zinc-800 p-0.5 gap-0.5">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => {
                        setTextAlign(align);
                        handleUpdateStyleProperty("textAlign", align);
                      }}
                      className={`flex-1 h-6 flex items-center justify-center rounded text-xs ${
                        textAlign === align ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {align === "left" && <AlignLeft size={12} />}
                      {align === "center" && <AlignCenter size={12} />}
                      {align === "right" && <AlignRight size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Inline CSS Input */}
            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
              <Label className="text-zinc-300 font-medium text-xs">
                Inline CSS (`style="..."`)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  placeholder="color: red; padding: 10px; font-weight: bold;"
                  className="h-8 bg-zinc-950 border-zinc-800 text-xs font-mono rounded-lg flex-1"
                />
                <Button
                  onClick={() => handleCustomStyleUpdate(customStyle)}
                  className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                >
                  Apply Style
                </Button>
              </div>
            </div>
          </div>
        ) : activeTab === "attrs" && selectedElement ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CSS Classes */}
            <div className="space-y-2 bg-zinc-900 p-3 rounded-xl border border-zinc-800/80">
              <Label className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Tag size={13} className="text-emerald-400" /> CSS Classes
              </Label>

              <div className="flex flex-wrap gap-1.5 min-h-10 bg-zinc-950 p-2 rounded-lg border border-zinc-800 items-center">
                {editClasses
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((cls, idx) => (
                    <span
                      key={`cls-${idx}`}
                      className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[11px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 group"
                    >
                      .{cls}
                      <button
                        onClick={() => handleRemoveClass(cls)}
                        className="text-emerald-500 hover:text-red-400 ml-0.5"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                {editClasses.trim() === "" && (
                  <span className="text-zinc-600 text-[11px] italic">No classes applied</span>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <Input
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddClass()}
                  placeholder="Add class name (e.g., active, container)..."
                  className="h-8 bg-zinc-950 border-zinc-800 text-xs font-mono rounded-lg flex-1"
                />
                <Button
                  onClick={handleAddClass}
                  className="h-8 px-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
                >
                  Add Class
                </Button>
              </div>
            </div>

            {/* Custom HTML Attributes */}
            <div className="space-y-2 bg-zinc-900 p-3 rounded-xl border border-zinc-800/80">
              <Label className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Code2 size={13} className="text-amber-400" /> HTML Attributes
              </Label>

              <div className="space-y-1 max-h-24 overflow-y-auto">
                {selectedElement.attributes.map((attr, idx) => (
                  <div
                    key={`attr-${idx}`}
                    className="flex items-center justify-between bg-zinc-950 px-2 py-1 rounded border border-zinc-800 font-mono text-[11px]"
                  >
                    <span className="text-amber-400">{attr.name}=</span>
                    <span className="text-zinc-300 truncate max-w-[150px]">"{attr.value}"</span>
                    <button
                      onClick={() => handleRemoveAttr(attr.name)}
                      className="text-zinc-500 hover:text-red-400 ml-2"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  value={newAttrKey}
                  onChange={(e) => setNewAttrKey(e.target.value)}
                  placeholder="Attribute (id, href, src...)"
                  className="h-8 bg-zinc-950 border-zinc-800 text-xs font-mono rounded-lg"
                />
                <div className="flex gap-1">
                  <Input
                    value={newAttrValue}
                    onChange={(e) => setNewAttrValue(e.target.value)}
                    placeholder="Value"
                    className="h-8 bg-zinc-950 border-zinc-800 text-xs font-mono rounded-lg flex-1"
                  />
                  <Button
                    onClick={() => handleAddOrUpdateAttr(newAttrKey, newAttrValue)}
                    className="h-8 px-2 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "tree" ? (
          <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-zinc-800">
              <Label className="text-zinc-300 font-medium text-xs flex items-center gap-1.5">
                <Layers size={13} className="text-blue-400" /> Interactive DOM Structure
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sendIframeMessage({ type: "GET_DOM_TREE" })}
                className="h-6 px-2 text-[10px] text-zinc-400 hover:text-white"
              >
                Refresh Tree
              </Button>
            </div>
            {domTree ? (
              <div className="max-h-36 overflow-y-auto">
                {renderTreeNode(domTree)}
              </div>
            ) : (
              <p className="text-zinc-500 text-xs italic">Loading DOM tree...</p>
            )}
          </div>
        ) : null}
      </div>
    </>
  )}
</div>
<GoogleFontsModal
        isOpen={isFontsModalOpen}
        onClose={() => setIsFontsModalOpen(false)}
        onApplyFontToSelectedElement={(family) => {
          setFontFamily(family);
          handleUpdateStyleProperty("fontFamily", family);
        }}
        onInjectFontToCode={(linkTag) => {
          if (code.includes("<head>")) {
            onCodeChange?.(code.replace("<head>", `<head>\n  ${linkTag}`));
          } else {
            onCodeChange?.(`${linkTag}\n${code}`);
          }
        }}
      />

      {/* --- IMPORT EXTERNAL WEBSITE MODAL --- */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-md w-[92vw] bg-zinc-950 border border-zinc-800 text-zinc-100 p-5 rounded-xl shadow-2xl">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-zinc-100">
              <Globe size={18} className="text-cyan-400" />
              Inspecionar Website Externo
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Digite ou cole o link (URL) de qualquer site público na web para carregar a estrutura HTML e poder inspecioná-la e alterá-la no editor em tempo real.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleImportExternalSite} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-300">URL do Site</Label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="https://example.com ou wikipedia.org"
                  value={importUrlInput}
                  onChange={(e) => setImportUrlInput(e.target.value)}
                  className="pl-9 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 focus-visible:ring-cyan-500 h-9 rounded-lg"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Exemplos: <code className="text-cyan-400">https://example.com</code>, <code className="text-cyan-400">news.ycombinator.com</code>, <code className="text-cyan-400">wikipedia.org</code>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(false)}
                className="h-8 px-3 text-xs bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isImportingUrl || !importUrlInput.trim()}
                className="h-8 px-4 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg gap-1.5"
              >
                {isImportingUrl ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Carregando Site...
                  </>
                ) : (
                  <>
                    <Globe size={13} /> Carregar e Inspecionar
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
