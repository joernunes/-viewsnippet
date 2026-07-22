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
  Box,
  Wand2,
  Component,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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
    if (!isInspectMode) return;
    let target = e.target;
    if (!target || target.id?.startsWith('inspector-')) return;

    e.preventDefault();
    e.stopPropagation();

    selectedElement = target;
    highlightElement(target, false);

    const info = getElementInfo(target);
    if (info) {
      window.parent.postMessage({ type: 'INSPECTOR_ELEMENT_SELECTED', data: info }, '*');
    }
  }

  function handleDblClick(e) {
    if (!isInspectMode) return;
    let target = e.target;
    if (!target || target.id?.startsWith('inspector-')) return;

    e.preventDefault();
    e.stopPropagation();

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
      isInspectMode = msg.enabled;
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
          el.style.marginTop = msg.margin.top + 'px';
          el.style.marginRight = msg.margin.right + 'px';
          el.style.marginBottom = msg.margin.bottom + 'px';
          el.style.marginLeft = msg.margin.left + 'px';
        }
        if (msg.padding) {
          el.style.paddingTop = msg.padding.top + 'px';
          el.style.paddingRight = msg.padding.right + 'px';
          el.style.paddingBottom = msg.padding.bottom + 'px';
          el.style.paddingLeft = msg.padding.left + 'px';
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

export function ElementInspector({
  iframeRef,
  code,
  onCodeChange,
  isInspectMode,
  setIsInspectMode,
  readOnly = false,
}: ElementInspectorProps) {
  const [selectedElement, setSelectedElement] = useState<SelectedElementData | null>(null);
  const [activeTab, setActiveTab] = useState<"props" | "box" | "styles" | "presets" | "attrs" | "tree">("props");
  const [domTree, setDomTree] = useState<DomTreeNode | null>(null);

  // Resize and collapse panel states
  const [inspectorHeight, setInspectorHeight] = useState(280);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isInspectMode && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [isInspectMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startY = e.clientY;
    const startHeight = isCollapsed ? 42 : inspectorHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = startHeight + deltaY;
      if (newHeight < 65) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
        setInspectorHeight(Math.max(120, Math.min(650, newHeight)));
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
  const [padding, setPadding] = useState("");
  const [margin, setMargin] = useState("");
  const [display, setDisplay] = useState("block");
  const [borderRadius, setBorderRadius] = useState("");
  const [textAlign, setTextAlign] = useState("left");
  const [customStyle, setCustomStyle] = useState("");

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
        if (elData.styles.padding) setPadding(elData.styles.padding);
        if (elData.styles.margin) setMargin(elData.styles.margin);
        if (elData.styles.display) setDisplay(elData.styles.display);
        if (elData.styles.borderRadius) setBorderRadius(elData.styles.borderRadius);
        if (elData.styles.textAlign) setTextAlign(elData.styles.textAlign);
      } else if (data.type === "INSPECTOR_HTML_UPDATED") {
        if (!readOnly && onCodeChange && data.html) {
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
    sendIframeMessage({
      type: "APPLY_BOX_MODEL",
      index: selectedElement.index,
      margin: newMargin,
      padding: newPadding,
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
    <div
      style={{ height: isCollapsed ? 42 : inspectorHeight }}
      className={`flex flex-col bg-zinc-950 border-t border-zinc-800/80 text-zinc-200 text-xs w-full shrink-0 shadow-2xl z-30 font-sans relative transition-all duration-100 ease-out ${
        isDragging ? "select-none" : ""
      }`}
    >
      {/* Top Resize Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="h-1.5 w-full bg-zinc-900 hover:bg-emerald-500/80 cursor-row-resize flex items-center justify-center transition-colors group select-none shrink-0"
        title="Arraste para redimensionar o Inspetor"
      >
        <div className="w-12 h-0.5 bg-zinc-700 group-hover:bg-white rounded-full transition-colors" />
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
              Click any element in preview canvas to inspect
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
            <Box size={12} className="text-amber-400" /> Box Model
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
          /* Chrome DevTools Box Model Diagram */
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Box size={14} /> Interactive Chrome DevTools Box Model
              </Label>
              <Button
                size="sm"
                onClick={() => handleApplyBoxModel()}
                className="h-6 px-2.5 text-[11px] bg-amber-600 hover:bg-amber-500 text-white rounded-md font-medium"
              >
                <Check size={11} className="mr-1" /> Save Spacing
              </Button>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex items-center justify-center">
              {/* Outer Margin Box */}
              <div className="bg-amber-950/40 border border-amber-600/60 rounded-xl p-3 w-full max-w-md text-center relative shadow-inner">
                <span className="absolute top-1 left-2 text-[10px] font-mono font-semibold text-amber-400 uppercase">
                  Margin (px)
                </span>
                {/* Margin Inputs */}
                <div className="flex items-center justify-between mb-1">
                  <div className="w-full flex justify-center">
                    <Input
                      type="number"
                      value={marginBox.top}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        const next = { ...marginBox, top: val };
                        setMarginBox(next);
                        handleApplyBoxModel(next, paddingBox);
                      }}
                      className="w-14 h-6 text-center text-xs font-mono bg-zinc-950 border-amber-800/80 text-amber-300 p-0 rounded"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Input
                    type="number"
                    value={marginBox.left}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const next = { ...marginBox, left: val };
                      setMarginBox(next);
                      handleApplyBoxModel(next, paddingBox);
                    }}
                    className="w-14 h-6 text-center text-xs font-mono bg-zinc-950 border-amber-800/80 text-amber-300 p-0 rounded shrink-0"
                  />

                  {/* Inner Padding Box */}
                  <div className="bg-emerald-950/40 border border-emerald-600/60 rounded-lg p-3 flex-1 relative">
                    <span className="absolute top-1 left-2 text-[10px] font-mono font-semibold text-emerald-400 uppercase">
                      Padding (px)
                    </span>

                    <div className="flex justify-center mb-1">
                      <Input
                        type="number"
                        value={paddingBox.top}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const next = { ...paddingBox, top: val };
                          setPaddingBox(next);
                          handleApplyBoxModel(marginBox, next);
                        }}
                        className="w-14 h-6 text-center text-xs font-mono bg-zinc-950 border-emerald-800/80 text-emerald-300 p-0 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Input
                        type="number"
                        value={paddingBox.left}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const next = { ...paddingBox, left: val };
                          setPaddingBox(next);
                          handleApplyBoxModel(marginBox, next);
                        }}
                        className="w-14 h-6 text-center text-xs font-mono bg-zinc-950 border-emerald-800/80 text-emerald-300 p-0 rounded shrink-0"
                      />

                      {/* Content Dimensions Box */}
                      <div className="bg-blue-950/60 border border-blue-500/80 rounded px-4 py-2 text-center text-xs font-mono font-bold text-blue-300 flex-1 my-1">
                        {selectedElement.rect.width} × {selectedElement.rect.height} px
                      </div>

                      <Input
                        type="number"
                        value={paddingBox.right}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const next = { ...paddingBox, right: val };
                          setPaddingBox(next);
                          handleApplyBoxModel(marginBox, next);
                        }}
                        className="w-14 h-6 text-center text-xs font-mono bg-zinc-950 border-emerald-800/80 text-emerald-300 p-0 rounded shrink-0"
                      />
                    </div>

                    <div className="flex justify-center mt-1">
                      <Input
                        type="number"
                        value={paddingBox.bottom}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const next = { ...paddingBox, bottom: val };
                          setPaddingBox(next);
                          handleApplyBoxModel(marginBox, next);
                        }}
                        className="w-14 h-6 text-center text-xs font-mono bg-zinc-950 border-emerald-800/80 text-emerald-300 p-0 rounded"
                      />
                    </div>
                  </div>

                  <Input
                    type="number"
                    value={marginBox.right}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const next = { ...marginBox, right: val };
                      setMarginBox(next);
                      handleApplyBoxModel(next, paddingBox);
                    }}
                    className="w-14 h-6 text-center text-xs font-mono bg-zinc-950 border-amber-800/80 text-amber-300 p-0 rounded shrink-0"
                  />
                </div>

                <div className="flex justify-center mt-1">
                  <Input
                    type="number"
                    value={marginBox.bottom}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const next = { ...marginBox, bottom: val };
                      setMarginBox(next);
                      handleApplyBoxModel(next, paddingBox);
                    }}
                    className="w-14 h-6 text-center text-xs font-mono bg-zinc-950 border-amber-800/80 text-amber-300 p-0 rounded"
                  />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Text Content Editor */}
            <div className="space-y-2 bg-zinc-900 p-3 rounded-xl border border-zinc-800/80">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <Type size={13} className="text-blue-400" /> Inner Text
                </Label>
                <Button
                  size="sm"
                  onClick={handleUpdateText}
                  className="h-6 px-2 text-[11px] bg-blue-600 hover:bg-blue-500 text-white rounded"
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

            {/* Right: Quick Insert Child Element */}
            <div className="space-y-2 bg-zinc-900 p-3 rounded-xl border border-zinc-800/80">
              <Label className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Plus size={13} className="text-emerald-400" /> Add Child Element
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-zinc-500">Tag Type</Label>
                  <select
                    value={newTagToAdd}
                    onChange={(e) => setNewTagToAdd(e.target.value)}
                    className="w-full h-8 bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-200 focus:outline-none"
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
                    className="h-8 bg-zinc-950 border-zinc-800 text-xs rounded-lg"
                  />
                </div>
              </div>
              <Button
                onClick={handleInsertChild}
                className="w-full h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg mt-1"
              >
                <Plus size={13} className="mr-1.5" /> Append inside &lt;{selectedElement.tagName}&gt;
              </Button>
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
  );
}
