import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { buildPreviewDocument } from "@/lib/preview-builder";
import type { ProjectFile } from "@/types";

interface PreviewPaneProps {
  files: ProjectFile[];
  entryFile: string;
}

type DevToolTab = "console" | "elements" | "source";

interface ConsoleEntry {
  id: number;
  method: string;
  args: string[];
  timestamp: number;
}

const CONSOLE_CAPTURE_JS = `(function(){var w=window,p=w.parent;var o={log:w.console.log,warn:w.console.warn,error:w.console.error,info:w.console.info};['log','warn','error','info'].forEach(function(m){w.console[m]=function(){o[m].apply(w.console,arguments);try{p.postMessage({type:'__preview_console__',method:m,args:Array.prototype.map.call(arguments,function(a){try{return typeof a==='object'?JSON.stringify(a,null,2):String(a)}catch(e){return String(a)}})},'*')}catch(e){}};});w.addEventListener('error',function(e){p.postMessage({type:'__preview_console__',method:'error',args:[e.message]},'*');});w.addEventListener('unhandledrejection',function(e){p.postMessage({type:'__preview_console__',method:'error',args:['Unhandled rejection: '+(e.reason||'')]},'*');});})();`;

const CONSOLE_CAPTURE_MARKER = "<!--___PREVIEW_CONSOLE_SCRIPT___-->";

function injectConsoleCapture(html: string): string {
  const tag = `<script>${CONSOLE_CAPTURE_JS}<\/script>${CONSOLE_CAPTURE_MARKER}`;
  const headEnd = html.search(/<\/head>/i);
  if (headEnd !== -1) return html.slice(0, headEnd) + tag + html.slice(headEnd);
  const bodyStart = html.search(/<body/i);
  if (bodyStart !== -1) return html.slice(0, bodyStart) + tag + html.slice(bodyStart);
  return tag + html;
}

function hasConsoleMarker(html: string): boolean {
  return html.includes(CONSOLE_CAPTURE_MARKER);
}

function injectCaptureScript(iframe: HTMLIFrameElement): void {
  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc?.head) return;
    const alreadyInjected = doc.body?.innerHTML?.includes(CONSOLE_CAPTURE_MARKER)
      || doc.head?.innerHTML?.includes(CONSOLE_CAPTURE_MARKER);
    if (alreadyInjected) return;
    const s = doc.createElement("script");
    s.textContent = CONSOLE_CAPTURE_JS;
    doc.head.appendChild(s);
  } catch {
    /* console capture unavailable */
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false, minute: "2-digit", second: "2-digit" });
}

/* ─── HTML Elements Tree ──────────────────────────── */

interface TreeNode {
  id: number;
  depth: number;
  tag: string;
  attrs: { name: string; value: string }[];
  children: TreeNode[];
  text: string | null;
  selfClosing: boolean;
  isComment: boolean;
}

function parseDom(node: Node, depth: number, idCounter: { v: number }): TreeNode | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (!text) return null;
    return { id: idCounter.v++, depth, tag: "", attrs: [], children: [], text, selfClosing: false, isComment: false };
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return { id: idCounter.v++, depth, tag: "", attrs: [], children: [], text: `<!--${node.textContent || ""}-->`, selfClosing: false, isComment: true };
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const voidElements = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
    const selfClosing = voidElements.has(tag) || !el.childNodes.length;
    const children: TreeNode[] = [];
    for (const child of el.childNodes) {
      const tn = parseDom(child, depth + 1, idCounter);
      if (tn) children.push(tn);
    }
    const attrs: { name: string; value: string }[] = [];
    for (const attr of el.attributes) {
      attrs.push({ name: attr.name, value: attr.value });
    }
    return { id: idCounter.v++, depth, tag, attrs, children, text: null, selfClosing, isComment: false };
  }
  return null;
}

function buildTree(html: string): TreeNode[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const roots: TreeNode[] = [];
  const idCounter = { v: 0 };
  for (const child of doc.childNodes) {
    const tn = parseDom(child, 0, idCounter);
    if (tn) roots.push(tn);
  }
  return roots;
}

function attrString(name: string, value: string): string {
  if (!value) return name;
  const q = value.includes('"') ? "'" : '"';
  return `${name}=${q}${value}${q}`;
}

function ElementsTree({ html }: { html: string }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const tree = useMemo(() => buildTree(html), [html]);

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setExpanded(new Set());
  }, [html]);

  function renderNode(node: TreeNode): React.ReactNode[] {
    const items: React.ReactNode[] = [];
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children.length > 0;

    if (node.isComment) {
      items.push(
        <div key={node.id} className="flex gap-2 py-0.5 px-1" style={{ paddingLeft: node.depth * 12 + 4 }}>
          <span className="text-muted-foreground/30 select-none shrink-0">&#9472;</span>
          <span className="text-muted-foreground/50 italic break-all">{"<!--" + (node.text?.slice(4, -3) || "") + "-->"}</span>
        </div>
      );
      return items;
    }

    if (node.text !== null) {
      items.push(
        <div key={node.id} className="flex gap-2 py-0.5 px-1" style={{ paddingLeft: node.depth * 12 + 4 }}>
          <span className="text-muted-foreground/30 select-none shrink-0">&#9472;</span>
          <span className="text-muted-foreground break-all whitespace-pre-wrap">{node.text}</span>
        </div>
      );
      return items;
    }

    const opener = (
      <button
        key={`open-${node.id}`}
        onClick={() => toggle(node.id)}
        className="flex items-center gap-1 py-0.5 px-1 hover:bg-surface-hover/50 rounded cursor-pointer text-left w-full"
        style={{ paddingLeft: node.depth * 12 + 4 }}
      >
        {hasChildren && (
          <Icon icon={isExpanded ? "ph:caret-down" : "ph:caret-right"} className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        )}
        {!hasChildren && <span className="w-3 shrink-0" />}
        <span className="text-blue-500 shrink-0">{"<"}</span>
        <span className="text-blue-600 font-medium shrink-0">{node.tag}</span>
        <span className="flex flex-wrap gap-0.5 min-w-0">
          {node.attrs.map((a) => (
            <span key={a.name} className="flex items-baseline gap-0">
              <span className="text-orange-500">{a.name}</span>
              {a.value && <span className="text-muted-foreground">=</span>}
              {a.value && <span className="text-green-600 break-all">{attrString(a.name, a.value)}</span>}
            </span>
          ))}
        </span>
        {node.selfClosing ? (
          <span className="text-blue-500 shrink-0">{" />"}</span>
        ) : (
          <span className="text-blue-500 shrink-0">{">"}</span>
        )}
      </button>
    );
    items.push(opener);

    if (hasChildren && isExpanded) {
      items.push(node.children.flatMap((c) => renderNode(c)));
      const closer = (
        <div
          key={`close-${node.id}`}
          className="flex items-center gap-1 py-0.5 px-1"
          style={{ paddingLeft: node.depth * 12 + 4 }}
        >
          <span className="w-3 shrink-0" />
          <span className="text-blue-500 shrink-0">{"</"}</span>
          <span className="text-blue-600 font-medium shrink-0">{node.tag}</span>
          <span className="text-blue-500 shrink-0">{">"}</span>
        </div>
      );
      items.push(closer);
    }

    return items;
  }

  if (tree.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground/40 text-[10px]">No elements</div>;
  }

  return <div className="p-1 font-mono text-[11px] leading-relaxed">{tree.flatMap((n) => renderNode(n))}</div>;
}

/* ─── PreviewPane ─────────────────────────────────── */

export function PreviewPane({ files, entryFile }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [devToolTab, setDevToolTab] = useState<DevToolTab>("console");
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const nextId = useRef(0);

  const documentStr = useMemo(() => {
    try {
      const result = buildPreviewDocument(files, entryFile);
      return injectConsoleCapture(result);
    } catch (err) {
      return null;
    }
  }, [files, entryFile]);

  useEffect(() => {
    if (documentStr === null) {
      try {
        buildPreviewDocument(files, entryFile);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to build preview");
      }
    } else {
      setError(null);
    }
  }, [documentStr, files, entryFile]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !documentStr) return;
    try {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const blob = new Blob([documentStr], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      iframe.src = url;
      setConsoleEntries([]);
      nextId.current = 0;
    } catch {
      setError("Failed to render preview");
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [documentStr]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      if (!hasConsoleMarker(documentStr || "")) {
        injectCaptureScript(iframe);
      }
    };
    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [documentStr]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "__preview_console__") {
        const entry: ConsoleEntry = {
          id: nextId.current++,
          method: event.data.method,
          args: event.data.args,
          timestamp: Date.now(),
        };
        setConsoleEntries((prev) => [...prev, entry]);
        setShowDevTools(true);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleEntries]);

  const handleRefresh = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !documentStr) return;
    setIsRefreshing(true);
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const blob = new Blob([documentStr], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;
    iframe.src = url;
    setConsoleEntries([]);
    nextId.current = 0;
    setTimeout(() => setIsRefreshing(false), 500);
  }, [documentStr]);

  const handleClearConsole = useCallback(() => {
    setConsoleEntries([]);
  }, []);

  const methodColor = (method: string) => {
    switch (method) {
      case "error": return "text-red-500";
      case "warn": return "text-yellow-500";
      case "info": return "text-blue-400";
      default: return "text-foreground";
    }
  };

  const methodBadge = (method: string) => {
    switch (method) {
      case "error": return "bg-red-500/15 text-red-500";
      case "warn": return "bg-yellow-500/15 text-yellow-500";
      case "info": return "bg-blue-500/15 text-blue-400";
      default: return "bg-foreground/10 text-muted-foreground";
    }
  };

  if (!documentStr && !error) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <Icon icon="ph:eye" className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Preview
            </span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="rounded-xl border border-border/60 bg-surface p-3.5">
              <Icon icon="ph:play" className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              Run your project to see the preview
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <Icon icon="ph:eye" className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Preview
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDevTools((v) => !v)}
            title="Toggle dev tools"
            className={`
              flex h-5 w-5 items-center justify-center rounded transition-colors duration-100
              ${showDevTools
                ? "text-foreground bg-surface-hover"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }
            `}
          >
            <Icon icon="ph:terminal" className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={handleRefresh}
            title="Refresh preview"
            className={`
              flex h-5 w-5 items-center justify-center rounded text-muted-foreground
              transition-colors duration-100 hover:bg-surface-hover hover:text-foreground
              ${isRefreshing ? "animate-spin-slow" : ""}
            `}
          >
            <Icon icon="ph:arrows-counter-clockwise" className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white relative min-h-0">
        {error ? (
          <div className="flex h-full items-center gap-2 bg-destructive/10 px-4 text-sm text-destructive animate-fade-in">
            <span>{error}</span>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="h-full w-full border-none"
            title="Preview"
          />
        )}
      </div>

      {showDevTools && (
        <div className="flex flex-col border-t border-border bg-surface shrink-0">
          <div className="flex items-center justify-between border-b border-border px-2">
            <div className="flex gap-1">
              {(["console", "elements", "source"] as DevToolTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDevToolTab(tab)}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider
                    transition-colors duration-100 cursor-pointer
                    ${devToolTab === tab
                      ? "text-foreground border-b border-foreground"
                      : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  <Icon
                    icon={tab === "console" ? "ph:terminal" : tab === "elements" ? "ph:tree-structure" : "ph:code"}
                    className="w-3 h-3"
                  />
                  {tab}
                </button>
              ))}
            </div>
            {devToolTab === "console" && consoleEntries.length > 0 && (
              <button
                onClick={handleClearConsole}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Icon icon="ph:x" className="w-2.5 h-2.5" />
                Clear
              </button>
            )}
          </div>

          <div className="h-48 overflow-y-auto bg-background/50">
            {devToolTab === "console" && (
              <>
                {consoleEntries.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground/40 text-[10px]">
                    No console output
                  </div>
                ) : (
                  <div className="flex flex-col gap-px p-1 font-mono text-[11px]">
                    {consoleEntries.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-2 py-0.5 px-1.5 rounded hover:bg-surface-hover/50">
                        <span className="text-[9px] text-muted-foreground/30 shrink-0 w-14 pt-px leading-snug">
                          {formatTime(entry.timestamp)}
                        </span>
                        <span className={`shrink-0 text-[9px] font-semibold uppercase px-1 rounded-sm leading-snug ${methodBadge(entry.method)}`}>
                          {entry.method}
                        </span>
                        <span className={`${methodColor(entry.method)} break-all min-w-0 leading-snug`}>
                          {entry.args.join(" ")}
                        </span>
                      </div>
                    ))}
                    <div ref={consoleEndRef} />
                  </div>
                )}
              </>
            )}
            {devToolTab === "elements" && documentStr && (
              <ElementsTree html={documentStr} />
            )}
            {devToolTab === "source" && (
              <pre className="p-2 font-mono text-[10px] leading-relaxed text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
                {documentStr}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
