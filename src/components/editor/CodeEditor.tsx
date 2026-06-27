import { useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { EditorView, keymap, placeholder, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, indentWithTab, undo, redo } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, foldKeymap } from "@codemirror/language";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import { THEME_REGISTRY } from "@/themes/registry";
import type { ProjectFile, CursorStyle } from "@/types";

export interface CodeEditorHandle {
  undo: () => void;
  redo: () => void;
  insertText: (text: string) => void;
  replaceLine: (line: string) => void;
  focus: () => void;
  hasFocus: () => boolean;
}

interface CodeEditorProps {
  value: string;
  language: ProjectFile["language"];
  theme: string;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  lineWrapping: boolean;
  cursorStyle: CursorStyle;
  showLineNumbers: boolean;
  highlightActiveLineEnabled: boolean;
  bracketMatchingEnabled: boolean;
  indentGuides: boolean;
  codeFolding: boolean;
  onChange: (value: string) => void;
  onFocusChange?: (focused: boolean) => void;
}

const themeComp = new Compartment();
const fontSizeComp = new Compartment();
const fontFamilyComp = new Compartment();
const tabSizeComp = new Compartment();
const lineWrappingComp = new Compartment();
const cursorStyleComp = new Compartment();
const lineNumbersComp = new Compartment();
const highlightActiveLineComp = new Compartment();
const bracketMatchingComp = new Compartment();
const indentGuidesComp = new Compartment();
const foldGutterComp = new Compartment();
const foldKeymapComp = new Compartment();

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor({
  value,
  language,
  theme,
  fontSize,
  fontFamily,
  tabSize,
  lineWrapping,
  cursorStyle,
  showLineNumbers,
  highlightActiveLineEnabled,
  bracketMatchingEnabled,
  indentGuides: showIndentGuides,
  codeFolding,
  onChange,
  onFocusChange,
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onFocusChangeRef = useRef(onFocusChange);
  onChangeRef.current = onChange;
  onFocusChangeRef.current = onFocusChange;

  useImperativeHandle(ref, () => ({
    undo: () => {
      const view = viewRef.current;
      if (view) undo(view);
    },
    redo: () => {
      const view = viewRef.current;
      if (view) redo(view);
    },
    insertText: (text: string) => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch(view.state.replaceSelection(text));
      view.focus();
    },
    replaceLine: (line: string) => {
      const view = viewRef.current;
      if (!view) return;
      const { state } = view;
      const pos = state.selection.main.head;
      const lineObj = state.doc.lineAt(pos);
      const changes = { from: lineObj.from, to: lineObj.to, insert: line };
      view.dispatch({ changes });
    },
    focus: () => viewRef.current?.focus(),
    hasFocus: () => viewRef.current?.hasFocus ?? false,
  }));

  const langExtension = useMemo(() => {
    switch (language) {
      case "html":
        return html();
      case "css":
        return css();
      case "javascript":
        return javascript();
      case "json":
        return json();
      case "markdown":
        return markdown();
      default:
        return javascript();
    }
  }, [language]);

  const themeExtension = useMemo(() => {
    return THEME_REGISTRY[theme] ?? THEME_REGISTRY["one-dark"]!;
  }, [theme]);

  const cursorTheme = useMemo(() => {
    return EditorView.theme({
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--cursor-color, currentColor)",
        borderLeftWidth: cursorStyle === "line" ? "1.5px" : undefined,
      },
      ".cm-cursor-secondary": {
        borderLeftColor: "var(--cursor-color, currentColor)",
        borderLeftWidth: "0.5px",
      },
      ...(cursorStyle === "block"
        ? {
            ".cm-cursor": {
              borderLeftWidth: "0 !important",
              width: "1ch",
              backgroundColor: "var(--cursor-color, currentColor)",
              opacity: "0.3",
            },
          }
        : {}),
      ...(cursorStyle === "underline"
        ? {
            ".cm-cursor": {
              borderLeftWidth: "0 !important",
              borderBottom: "1.5px solid var(--cursor-color, currentColor)",
            },
          }
        : {}),
    });
  }, [cursorStyle]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const value = update.state.doc.toString();
        onChangeRef.current(value);
      }
      if (update.focusChanged) {
        onFocusChangeRef.current?.(update.view.hasFocus);
      }
    });

    const extensions: import("@codemirror/state").Extension[] = [
      keymap.of([...defaultKeymap, indentWithTab]),
      langExtension,
      themeComp.of(themeExtension),
      fontSizeComp.of(
        EditorView.theme({
          "&": { fontSize: `${fontSize}px` },
        }),
      ),
      fontFamilyComp.of(
        EditorView.theme({
          "&": { fontFamily },
        }),
      ),
      tabSizeComp.of(EditorState.tabSize.of(tabSize)),
      lineWrappingComp.of(lineWrapping ? EditorView.lineWrapping : []),
      cursorStyleComp.of(cursorTheme),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      autocompletion(),
      closeBrackets(),
      lineNumbersComp.of(showLineNumbers ? lineNumbers() : []),
      bracketMatchingComp.of(bracketMatchingEnabled ? bracketMatching() : []),
      highlightActiveLineComp.of(highlightActiveLineEnabled ? highlightActiveLine() : []),
      placeholder("Start coding…"),
      updateListener,
      indentGuidesComp.of(
        showIndentGuides
          ? EditorView.theme({
              ".cm-indentMarker": {
                borderLeft: "1px dotted var(--border, #333)",
              },
            })
          : [],
      ),
      foldGutterComp.of(codeFolding ? foldGutter() : []),
      foldKeymapComp.of(codeFolding ? foldKeymap() : []),
    ];

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: themeComp.reconfigure(themeExtension),
    });
  }, [themeExtension]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: fontSizeComp.reconfigure(
        EditorView.theme({
          "&": { fontSize: `${fontSize}px` },
        }),
      ),
    });
  }, [fontSize]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: fontFamilyComp.reconfigure(
        EditorView.theme({
          "&": { fontFamily },
        }),
      ),
    });
  }, [fontFamily]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: tabSizeComp.reconfigure(EditorState.tabSize.of(tabSize)),
    });
  }, [tabSize]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: lineWrappingComp.reconfigure(lineWrapping ? EditorView.lineWrapping : []),
    });
  }, [lineWrapping]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: cursorStyleComp.reconfigure(cursorTheme),
    });
  }, [cursorTheme]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: lineNumbersComp.reconfigure(showLineNumbers ? lineNumbers() : []),
    });
  }, [showLineNumbers]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: highlightActiveLineComp.reconfigure(highlightActiveLineEnabled ? highlightActiveLine() : []),
    });
  }, [highlightActiveLineEnabled]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: bracketMatchingComp.reconfigure(bracketMatchingEnabled ? bracketMatching() : []),
    });
  }, [bracketMatchingEnabled]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: indentGuidesComp.reconfigure(
        showIndentGuides
          ? EditorView.theme({
              ".cm-indentMarker": {
                borderLeft: "1px dotted var(--border, #333)",
              },
            })
          : [],
      ),
    });
  }, [showIndentGuides]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: foldGutterComp.reconfigure(codeFolding ? foldGutter() : []),
    });
  }, [codeFolding]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: foldKeymapComp.reconfigure(codeFolding ? foldKeymap() : []),
    });
  }, [codeFolding]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: current.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="h-full [&_.cm-editor]:h-full [&_.cm-editor]:w-full [&_.cm-scroller]:font-mono [&_.cm-line]:leading-relaxed"
    />
  );
});
