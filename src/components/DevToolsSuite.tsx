import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Wifi,
  Zap,
  HardDrive,
  MousePointer,
  Trash2,
  Filter,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
  Search,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Plus,
  Layers,
  Sparkles,
  Box,
  Copy,
  Check,
  Code2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { SelectedElementData, DomTreeNode } from "./ElementInspector";

export interface ConsoleLogItem {
  id: string;
  level: "log" | "info" | "warn" | "error";
  args: string[];
  timestamp: string;
  count?: number;
}

export interface NetworkReqItem {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  duration: number;
  type: string;
  timestamp: string;
  requestBody?: string;
  responseBody?: string;
}

export interface PerfData {
  scorePerf: number;
  scoreA11y: number;
  scoreBestPractices: number;
  domNodes: number;
  cssRules: number;
  loadTimeMs: number;
  fcpMs: number;
  memoryMb?: number;
  suggestions: { type: "warn" | "info" | "pass"; message: string }[];
}

export interface StorageData {
  localStorage: { key: string; value: string }[];
  sessionStorage: { key: string; value: string }[];
  cookies: { key: string; value: string }[];
}

interface DevToolsSuiteProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  code: string;
  onCodeChange?: (newCode: string) => void;
  isOpen: boolean;
  onClose: () => void;
  activeTab?: "console" | "network" | "perf" | "storage" | "inspector";
  selectedElementData?: SelectedElementData | null;
  isInspectMode?: boolean;
  setIsInspectMode?: (val: boolean) => void;
}

export const DEVTOOLS_INJECT_SCRIPT = `
<script id="devtools-comprehensive-script">
(function() {
  // --- CONSOLE INTERCEPTOR ---
  const origConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  function safeStringify(obj) {
    try {
      if (typeof obj === 'undefined') return 'undefined';
      if (obj === null) return 'null';
      if (typeof obj === 'function') return obj.toString();
      if (typeof obj === 'object') {
        const cache = new Set();
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) return '[Circular]';
            cache.add(value);
          }
          return value;
        }, 2);
      }
      return String(obj);
    } catch(err) {
      return String(obj);
    }
  }

  function formatArgs(args) {
    return Array.from(args).map(arg => safeStringify(arg));
  }

  function sendConsoleMsg(level, args) {
    const timeStr = new Date().toLocaleTimeString();
    try {
      window.parent.postMessage({
        type: 'DEVTOOLS_CONSOLE_LOG',
        log: {
          id: Math.random().toString(36).substring(2, 9),
          level: level,
          args: formatArgs(args),
          timestamp: timeStr
        }
      }, '*');
    } catch(e) {}
  }

  console.log = function() { sendConsoleMsg('log', arguments); origConsole.log.apply(console, arguments); };
  console.info = function() { sendConsoleMsg('info', arguments); origConsole.info.apply(console, arguments); };
  console.warn = function() { sendConsoleMsg('warn', arguments); origConsole.warn.apply(console, arguments); };
  console.error = function() { sendConsoleMsg('error', arguments); origConsole.error.apply(console, arguments); };

  window.addEventListener('error', function(e) {
    if (e.message === 'Script error.' || e.message === 'Script error') return;
    sendConsoleMsg('error', [e.message + ' at ' + (e.filename || '') + ':' + (e.lineno || 0)]);
  });

  window.addEventListener('unhandledrejection', function(e) {
    sendConsoleMsg('error', ['Unhandled Promise Rejection: ' + safeStringify(e.reason)]);
  });

  // --- NETWORK INTERCEPTOR ---
  const origFetch = window.fetch;
  if (origFetch) {
    window.fetch = async function() {
      const startTime = performance.now();
      const url = arguments[0] instanceof Request ? arguments[0].url : String(arguments[0]);
      const options = arguments[1] || {};
      const method = (options.method || 'GET').toUpperCase();
      const timeStr = new Date().toLocaleTimeString();
      const id = Math.random().toString(36).substring(2, 9);

      let reqBody = '';
      if (options.body) {
        reqBody = typeof options.body === 'string' ? options.body : safeStringify(options.body);
      }

      try {
        const response = await origFetch.apply(this, arguments);
        const duration = Math.round(performance.now() - startTime);
        
        let resBody = '';
        try {
          const clone = response.clone();
          resBody = await clone.text();
        } catch(e) {
          resBody = '[Binary or Unreadable Stream]';
        }

        window.parent.postMessage({
          type: 'DEVTOOLS_NETWORK_REQ',
          req: {
            id: id,
            url: url,
            method: method,
            status: response.status,
            statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
            duration: duration,
            type: 'fetch',
            timestamp: timeStr,
            requestBody: reqBody,
            responseBody: resBody.slice(0, 5000)
          }
        }, '*');

        return response;
      } catch(err) {
        const duration = Math.round(performance.now() - startTime);
        window.parent.postMessage({
          type: 'DEVTOOLS_NETWORK_REQ',
          req: {
            id: id,
            url: url,
            method: method,
            status: 0,
            statusText: err.message || 'Failed',
            duration: duration,
            type: 'fetch',
            timestamp: timeStr,
            requestBody: reqBody,
            responseBody: err.stack || err.message
          }
        }, '*');
        throw err;
      }
    };
  }

  // Intercept XMLHttpRequest
  const origXHR = window.XMLHttpRequest;
  if (origXHR) {
    const origOpen = origXHR.prototype.open;
    const origSend = origXHR.prototype.send;

    origXHR.prototype.open = function(method, url) {
      this._dt_method = method;
      this._dt_url = url;
      this._dt_startTime = performance.now();
      return origOpen.apply(this, arguments);
    };

    origXHR.prototype.send = function(body) {
      this._dt_reqBody = body ? safeStringify(body) : '';
      const xhr = this;

      xhr.addEventListener('loadend', function() {
        const duration = Math.round(performance.now() - (xhr._dt_startTime || performance.now()));
        const timeStr = new Date().toLocaleTimeString();

        window.parent.postMessage({
          type: 'DEVTOOLS_NETWORK_REQ',
          req: {
            id: Math.random().toString(36).substring(2, 9),
            url: xhr._dt_url || '',
            method: (xhr._dt_method || 'GET').toUpperCase(),
            status: xhr.status,
            statusText: xhr.statusText || (xhr.status >= 200 && xhr.status < 400 ? 'OK' : 'Error'),
            duration: duration,
            type: 'xhr',
            timestamp: timeStr,
            requestBody: xhr._dt_reqBody,
            responseBody: (xhr.responseText || '').slice(0, 5000)
          }
        }, '*');
      });

      return origSend.apply(this, arguments);
    };
  }

  // --- PERFORMANCE & STORAGE MEASUREMENT ---
  function computePerformanceMetrics() {
    const domNodes = document.getElementsByTagName('*').length;
    let cssRules = 0;
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          if (sheet.cssRules) cssRules += sheet.cssRules.length;
        } catch(e) {}
      });
    } catch(e) {}

    const perfEntries = performance.getEntriesByType('navigation');
    const navTime = perfEntries[0] ? perfEntries[0].duration : performance.now();

    let scorePerf = 98;
    if (domNodes > 1500) scorePerf -= 15;
    else if (domNodes > 800) scorePerf -= 8;

    if (cssRules > 3000) scorePerf -= 10;
    if (navTime > 2000) scorePerf -= 15;

    scorePerf = Math.max(40, Math.min(100, Math.round(scorePerf)));

    const suggestions = [];
    if (domNodes > 600) {
      suggestions.push({ type: 'warn', message: 'High DOM node count (' + domNodes + '). Consider simplifying HTML hierarchy.' });
    } else {
      suggestions.push({ type: 'pass', message: 'Optimal DOM tree size (' + domNodes + ' elements).' });
    }

    if (cssRules > 1000) {
      suggestions.push({ type: 'info', message: 'Large CSS ruleset detected (' + cssRules + ' rules).' });
    } else {
      suggestions.push({ type: 'pass', message: 'Lightweight CSS styling (' + cssRules + ' rules).' });
    }

    // Check accessibility basics
    const images = Array.from(document.querySelectorAll('img'));
    const imgsWithoutAlt = images.filter(img => !img.hasAttribute('alt'));
    let scoreA11y = 100;
    if (imgsWithoutAlt.length > 0) {
      scoreA11y -= imgsWithoutAlt.length * 10;
      suggestions.push({ type: 'warn', message: imgsWithoutAlt.length + ' image(s) missing alt attribute.' });
    } else {
      suggestions.push({ type: 'pass', message: 'All images include valid alt attributes.' });
    }

    const buttonsWithoutText = Array.from(document.querySelectorAll('button')).filter(b => !b.innerText.trim() && !b.getAttribute('aria-label'));
    if (buttonsWithoutText.length > 0) {
      scoreA11y -= 15;
      suggestions.push({ type: 'warn', message: buttonsWithoutText.length + ' button(s) lack accessible labels.' });
    } else {
      suggestions.push({ type: 'pass', message: 'Buttons are properly labeled.' });
    }

    scoreA11y = Math.max(50, Math.min(100, Math.round(scoreA11y)));

    let memoryMb = undefined;
    if (performance.memory) {
      memoryMb = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
    }

    return {
      scorePerf: scorePerf,
      scoreA11y: scoreA11y,
      scoreBestPractices: 95,
      domNodes: domNodes,
      cssRules: cssRules,
      loadTimeMs: Math.round(navTime),
      fcpMs: Math.round(navTime * 0.4),
      memoryMb: memoryMb,
      suggestions: suggestions
    };
  }

  function getStorageData() {
    const ls = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) ls.push({ key: k, value: localStorage.getItem(k) || '' });
      }
    } catch(e) {}

    const ss = [];
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k) ss.push({ key: k, value: sessionStorage.getItem(k) || '' });
      }
    } catch(e) {}

    const ck = [];
    try {
      if (document.cookie) {
        document.cookie.split(';').forEach(c => {
          const parts = c.split('=');
          if (parts.length >= 2) {
            ck.push({ key: parts[0].trim(), value: parts.slice(1).join('=').trim() });
          }
        });
      }
    } catch(e) {}

    return { localStorage: ls, sessionStorage: ss, cookies: ck };
  }

  // --- REPL MESSAGES ---
  window.addEventListener('message', function(event) {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'DEVTOOLS_EVAL_REQ') {
      try {
        const res = window.eval(msg.code);
        sendConsoleMsg('log', ['> ' + msg.code, res]);
        window.parent.postMessage({ type: 'DEVTOOLS_EVAL_RES', result: safeStringify(res), success: true }, '*');
      } catch(err) {
        sendConsoleMsg('error', ['> ' + msg.code, err.message]);
        window.parent.postMessage({ type: 'DEVTOOLS_EVAL_RES', error: err.message, success: false }, '*');
      }
    } else if (msg.type === 'DEVTOOLS_GET_PERF_REQ') {
      const data = computePerformanceMetrics();
      window.parent.postMessage({ type: 'DEVTOOLS_PERF_RES', data: data }, '*');
    } else if (msg.type === 'DEVTOOLS_GET_STORAGE_REQ') {
      const data = getStorageData();
      window.parent.postMessage({ type: 'DEVTOOLS_STORAGE_RES', data: data }, '*');
    } else if (msg.type === 'DEVTOOLS_CLEAR_STORAGE_REQ') {
      try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
      window.parent.postMessage({ type: 'DEVTOOLS_STORAGE_RES', data: getStorageData() }, '*');
    }
  });

  // Initial welcome console message
  setTimeout(() => {
    sendConsoleMsg('info', ['[DevTools] Runtime initialized successfully.']);
  }, 200);
})();
</script>
`;

export function DevToolsSuite({
  iframeRef,
  code,
  onCodeChange,
  isOpen,
  onClose,
  activeTab: initialTab = "console",
  selectedElementData,
  isInspectMode = false,
  setIsInspectMode,
}: DevToolsSuiteProps) {
  const [tab, setTab] = useState<"console" | "network" | "perf" | "storage" | "inspector">(initialTab);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogItem[]>([]);
  const [logFilter, setLogFilter] = useState<"all" | "log" | "warn" | "error" | "info">("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [replInput, setReplInput] = useState("");

  const [networkReqs, setNetworkReqs] = useState<NetworkReqItem[]>([]);
  const [selectedNetworkReq, setSelectedNetworkReq] = useState<NetworkReqItem | null>(null);

  const [perfData, setPerfData] = useState<PerfData | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const [storageData, setStorageData] = useState<StorageData>({
    localStorage: [],
    sessionStorage: [],
    cookies: [],
  });

  const [isMaximized, setIsMaximized] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  // Handle message events from preview iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const msg = e.data;
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "DEVTOOLS_CONSOLE_LOG" && msg.log) {
        setConsoleLogs((prev) => [...prev.slice(-200), msg.log]);
      } else if (msg.type === "DEVTOOLS_NETWORK_REQ" && msg.req) {
        setNetworkReqs((prev) => [msg.req, ...prev.slice(0, 100)]);
      } else if (msg.type === "DEVTOOLS_PERF_RES" && msg.data) {
        setPerfData(msg.data);
        setIsAuditing(false);
      } else if (msg.type === "DEVTOOLS_STORAGE_RES" && msg.data) {
        setStorageData(msg.data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Auto-scroll console
  useEffect(() => {
    if (tab === "console") {
      consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs, tab]);

  // Request storage / perf on tab switch
  useEffect(() => {
    if (tab === "perf") {
      runAudit();
    } else if (tab === "storage") {
      refreshStorage();
    }
  }, [tab]);

  const runAudit = () => {
    setIsAuditing(true);
    iframeRef.current?.contentWindow?.postMessage({ type: "DEVTOOLS_GET_PERF_REQ" }, "*");
  };

  const refreshStorage = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: "DEVTOOLS_GET_STORAGE_REQ" }, "*");
  };

  const clearStorage = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: "DEVTOOLS_CLEAR_STORAGE_REQ" }, "*");
  };

  const handleReplSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replInput.trim()) return;

    iframeRef.current?.contentWindow?.postMessage(
      { type: "DEVTOOLS_EVAL_REQ", code: replInput },
      "*"
    );
    setReplInput("");
  };

  if (!isOpen) return null;

  const filteredLogs = consoleLogs.filter((log) => {
    if (logFilter !== "all" && log.level !== logFilter) return false;
    if (searchFilter) {
      const query = searchFilter.toLowerCase();
      return log.args.some((arg) => arg.toLowerCase().includes(query));
    }
    return true;
  });

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-[#121214] border-t border-zinc-800 text-zinc-200 flex flex-col shadow-2xl transition-all duration-200 ${
        isMaximized ? "h-[85vh]" : "h-72 sm:h-80"
      }`}
    >
      {/* DevTools Top Navigation Bar */}
      <div className="h-10 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTab("console")}
            className={`h-7 px-2.5 text-xs font-medium rounded-md gap-1.5 transition-colors ${
              tab === "console"
                ? "bg-zinc-800 text-emerald-400 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Terminal size={13} />
            Console
            {consoleLogs.filter((l) => l.level === "error").length > 0 && (
              <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                {consoleLogs.filter((l) => l.level === "error").length}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTab("network")}
            className={`h-7 px-2.5 text-xs font-medium rounded-md gap-1.5 transition-colors ${
              tab === "network"
                ? "bg-zinc-800 text-emerald-400 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Wifi size={13} />
            Network
            {networkReqs.length > 0 && (
              <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
                {networkReqs.length}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTab("perf")}
            className={`h-7 px-2.5 text-xs font-medium rounded-md gap-1.5 transition-colors ${
              tab === "perf"
                ? "bg-zinc-800 text-emerald-400 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Zap size={13} />
            Audits & Perf
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTab("storage")}
            className={`h-7 px-2.5 text-xs font-medium rounded-md gap-1.5 transition-colors ${
              tab === "storage"
                ? "bg-zinc-800 text-emerald-400 font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <HardDrive size={13} />
            Storage
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {setIsInspectMode && (
            <Button
              variant={isInspectMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsInspectMode(!isInspectMode)}
              className={`h-7 px-2 text-xs rounded-md gap-1 ${
                isInspectMode ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "text-zinc-400"
              }`}
            >
              <MousePointer size={12} />
              <span className="hidden sm:inline">Inspect Element</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMaximized(!isMaximized)}
            className="h-7 w-7 text-zinc-400 hover:text-white"
            title={isMaximized ? "Restore Size" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-zinc-400 hover:text-white"
            title="Close DevTools"
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden relative font-mono text-xs">
        {/* --- CONSOLE TAB --- */}
        {tab === "console" && (
          <div className="h-full flex flex-col bg-[#0d0d0f]">
            {/* Filter toolbar */}
            <div className="h-8 border-b border-zinc-800/80 px-3 flex items-center justify-between gap-2 bg-[#121215] shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConsoleLogs([])}
                  className="h-6 w-6 text-zinc-400 hover:text-white"
                  title="Clear Console"
                >
                  <Trash2 size={12} />
                </Button>

                <div className="h-3 w-[1px] bg-zinc-800" />

                <div className="flex items-center gap-1 text-[11px]">
                  {(["all", "error", "warn", "info", "log"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLogFilter(lvl)}
                      className={`px-2 py-0.5 rounded capitalize transition-colors ${
                        logFilter === lvl
                          ? "bg-zinc-800 text-emerald-400 font-semibold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-40 sm:w-56">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter console..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded pl-6 pr-2 py-0.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Log List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-600 italic text-[11px]">
                  Console output will appear here when preview code executes...
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 px-2 py-1 rounded border-b border-zinc-900/60 leading-relaxed font-mono text-[11px] ${
                      log.level === "error"
                        ? "bg-red-950/20 text-red-300 border-l-2 border-l-red-500"
                        : log.level === "warn"
                        ? "bg-amber-950/20 text-amber-300 border-l-2 border-l-amber-500"
                        : log.level === "info"
                        ? "bg-blue-950/20 text-sky-300 border-l-2 border-l-sky-500"
                        : "text-zinc-300 hover:bg-zinc-900/50"
                    }`}
                  >
                    <span className="text-zinc-600 shrink-0 text-[10px]">{log.timestamp}</span>
                    <span className="shrink-0">
                      {log.level === "error" && <XCircle size={12} className="text-red-400 mt-0.5" />}
                      {log.level === "warn" && <AlertTriangle size={12} className="text-amber-400 mt-0.5" />}
                      {log.level === "info" && <Info size={12} className="text-sky-400 mt-0.5" />}
                      {log.level === "log" && <ChevronRight size={12} className="text-zinc-500 mt-0.5" />}
                    </span>
                    <div className="flex-1 overflow-x-auto whitespace-pre-wrap break-words">
                      {log.args.join(" ")}
                    </div>
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>

            {/* REPL Terminal Input */}
            <form
              onSubmit={handleReplSubmit}
              className="h-8 border-t border-zinc-800 bg-[#121215] flex items-center px-2 shrink-0 gap-2"
            >
              <ChevronRight size={14} className="text-emerald-500 shrink-0" />
              <input
                type="text"
                placeholder="Execute JavaScript in preview context... (e.g. document.title)"
                value={replInput}
                onChange={(e) => setReplInput(e.target.value)}
                className="flex-1 bg-transparent border-none text-zinc-200 text-xs focus:outline-none placeholder:text-zinc-600"
              />
              <button type="submit" className="text-xs text-emerald-400 font-semibold hover:underline px-2">
                Run
              </button>
            </form>
          </div>
        )}

        {/* --- NETWORK TAB --- */}
        {tab === "network" && (
          <div className="h-full flex flex-col bg-[#0d0d0f]">
            <div className="h-8 border-b border-zinc-800/80 px-3 flex items-center justify-between bg-[#121215] shrink-0">
              <span className="text-[11px] text-zinc-400 font-semibold">
                Captured Network Traffic ({networkReqs.length} requests)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNetworkReqs([])}
                className="h-6 text-[11px] text-zinc-400 hover:text-white"
              >
                Clear Network Logs
              </Button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                {networkReqs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-600 italic text-[11px]">
                    No network requests intercepted yet. Make a fetch() call in your preview code!
                  </div>
                ) : (
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 sticky top-0">
                        <th className="p-2 font-medium">Method</th>
                        <th className="p-2 font-medium">URL</th>
                        <th className="p-2 font-medium">Status</th>
                        <th className="p-2 font-medium">Type</th>
                        <th className="p-2 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {networkReqs.map((req) => (
                        <tr
                          key={req.id}
                          onClick={() => setSelectedNetworkReq(req)}
                          className={`border-b border-zinc-900/80 cursor-pointer hover:bg-zinc-900/60 transition-colors ${
                            selectedNetworkReq?.id === req.id ? "bg-zinc-800/80 text-emerald-300" : ""
                          }`}
                        >
                          <td className="p-2 font-bold text-sky-400">{req.method}</td>
                          <td className="p-2 truncate max-w-[200px] text-zinc-300" title={req.url}>
                            {req.url}
                          </td>
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                req.status >= 200 && req.status < 300
                                  ? "bg-emerald-950 text-emerald-400"
                                  : "bg-red-950 text-red-400"
                              }`}
                            >
                              {req.status} {req.statusText}
                            </span>
                          </td>
                          <td className="p-2 text-zinc-500 uppercase">{req.type}</td>
                          <td className="p-2 text-zinc-400">{req.duration} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Request detail drawer */}
              {selectedNetworkReq && (
                <div className="w-1/2 border-l border-zinc-800 bg-[#121215] p-3 overflow-y-auto flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-bold text-emerald-400 text-xs">Request Details</span>
                    <button
                      onClick={() => setSelectedNetworkReq(null)}
                      className="text-zinc-500 hover:text-white text-xs"
                    >
                      Close
                    </button>
                  </div>

                  <div>
                    <span className="text-zinc-500 block text-[10px]">URL</span>
                    <span className="text-zinc-200 break-all text-[11px] font-mono">{selectedNetworkReq.url}</span>
                  </div>

                  {selectedNetworkReq.requestBody && (
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Request Body</span>
                      <pre className="bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300 overflow-x-auto text-[10px]">
                        {selectedNetworkReq.requestBody}
                      </pre>
                    </div>
                  )}

                  <div>
                    <span className="text-zinc-500 block text-[10px]">Response Body</span>
                    <pre className="bg-zinc-950 p-2 rounded border border-zinc-800 text-emerald-400 overflow-x-auto text-[10px] max-h-40">
                      {selectedNetworkReq.responseBody || "[Empty Response]"}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- PERFORMANCE & AUDITS TAB --- */}
        {tab === "perf" && (
          <div className="h-full overflow-y-auto p-4 bg-[#0d0d0f] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Zap size={15} className="text-amber-400" />
                  Core Web Vitals & Performance Audit
                </h3>
                <p className="text-zinc-500 text-[11px]">
                  Real-time Lighthouse-style performance metrics and DOM optimization suggestions.
                </p>
              </div>

              <Button
                size="sm"
                onClick={runAudit}
                disabled={isAuditing}
                className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 text-xs"
              >
                <RefreshCw size={12} className={isAuditing ? "animate-spin" : ""} />
                {isAuditing ? "Auditing..." : "Re-Run Audit"}
              </Button>
            </div>

            {perfData ? (
              <div className="space-y-4">
                {/* Metric Scores */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3 text-center flex flex-col items-center">
                    <div
                      className={`text-2xl font-black ${
                        perfData.scorePerf >= 90
                          ? "text-emerald-400"
                          : perfData.scorePerf >= 70
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {perfData.scorePerf}
                    </div>
                    <span className="text-[11px] text-zinc-400 font-medium mt-0.5">Performance Score</span>
                  </div>

                  <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3 text-center flex flex-col items-center">
                    <div
                      className={`text-2xl font-black ${
                        perfData.scoreA11y >= 90
                          ? "text-emerald-400"
                          : perfData.scoreA11y >= 70
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {perfData.scoreA11y}
                    </div>
                    <span className="text-[11px] text-zinc-400 font-medium mt-0.5">Accessibility (a11y)</span>
                  </div>

                  <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3 text-center flex flex-col items-center">
                    <div className="text-2xl font-black text-emerald-400">{perfData.scoreBestPractices}</div>
                    <span className="text-[11px] text-zinc-400 font-medium mt-0.5">Best Practices</span>
                  </div>
                </div>

                {/* Key Diagnostics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800">
                    <span className="text-zinc-500 block">Total DOM Nodes</span>
                    <span className="text-zinc-100 font-bold text-sm">{perfData.domNodes}</span>
                  </div>
                  <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800">
                    <span className="text-zinc-500 block">CSS Rules Count</span>
                    <span className="text-zinc-100 font-bold text-sm">{perfData.cssRules}</span>
                  </div>
                  <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800">
                    <span className="text-zinc-500 block">Page Load Time</span>
                    <span className="text-zinc-100 font-bold text-sm">{perfData.loadTimeMs} ms</span>
                  </div>
                  <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800">
                    <span className="text-zinc-500 block">JS Heap Memory</span>
                    <span className="text-zinc-100 font-bold text-sm">
                      {perfData.memoryMb ? `${perfData.memoryMb} MB` : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Audit Recommendations */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-zinc-300">Actionable Optimization Tips</span>
                  {perfData.suggestions.map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-[11px] flex items-center gap-2 border ${
                        s.type === "warn"
                          ? "bg-amber-950/20 text-amber-300 border-amber-900/50"
                          : s.type === "pass"
                          ? "bg-emerald-950/20 text-emerald-300 border-emerald-900/50"
                          : "bg-sky-950/20 text-sky-300 border-sky-900/50"
                      }`}
                    >
                      {s.type === "warn" && <AlertTriangle size={13} className="shrink-0 text-amber-400" />}
                      {s.type === "pass" && <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />}
                      {s.type === "info" && <Info size={13} className="shrink-0 text-sky-400" />}
                      <span>{s.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-zinc-500 gap-2">
                <RefreshCw size={24} className="animate-spin text-emerald-500" />
                <span>Gathering preview metrics...</span>
              </div>
            )}
          </div>
        )}

        {/* --- STORAGE TAB --- */}
        {tab === "storage" && (
          <div className="h-full overflow-y-auto p-4 bg-[#0d0d0f] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200">Local & Session Storage Inspector</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={refreshStorage} className="h-7 text-[11px] gap-1">
                  <RefreshCw size={11} /> Refresh
                </Button>
                <Button size="sm" variant="destructive" onClick={clearStorage} className="h-7 text-[11px] gap-1">
                  <Trash2 size={11} /> Clear All Storage
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-emerald-400 block mb-1">
                  LocalStorage ({storageData.localStorage.length} items)
                </span>
                {storageData.localStorage.length === 0 ? (
                  <div className="text-zinc-600 italic text-[11px] p-2 bg-zinc-900/50 rounded border border-zinc-800">
                    No localStorage key-value pairs stored in preview.
                  </div>
                ) : (
                  <div className="bg-zinc-900/80 rounded border border-zinc-800 overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-zinc-800/80 text-zinc-400">
                          <th className="p-2 font-medium">Key</th>
                          <th className="p-2 font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storageData.localStorage.map((item, i) => (
                          <tr key={i} className="border-t border-zinc-800/60 font-mono">
                            <td className="p-2 font-bold text-sky-400">{item.key}</td>
                            <td className="p-2 text-zinc-300 truncate max-w-xs">{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold text-amber-400 block mb-1">
                  SessionStorage ({storageData.sessionStorage.length} items)
                </span>
                {storageData.sessionStorage.length === 0 ? (
                  <div className="text-zinc-600 italic text-[11px] p-2 bg-zinc-900/50 rounded border border-zinc-800">
                    No sessionStorage items stored.
                  </div>
                ) : (
                  <div className="bg-zinc-900/80 rounded border border-zinc-800 overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-zinc-800/80 text-zinc-400">
                          <th className="p-2 font-medium">Key</th>
                          <th className="p-2 font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storageData.sessionStorage.map((item, i) => (
                          <tr key={i} className="border-t border-zinc-800/60 font-mono">
                            <td className="p-2 font-bold text-amber-400">{item.key}</td>
                            <td className="p-2 text-zinc-300 truncate max-w-xs">{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
