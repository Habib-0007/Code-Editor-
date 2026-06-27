import { oneDark } from "@codemirror/theme-one-dark";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

/* ─── base chrome shared across all themes ──────────── */
function baseTheme(
  dark: boolean,
  theme: {
    background: string;
    foreground: string;
    activeLine?: string;
    gutterBg?: string;
    gutterFg?: string;
    selection?: string;
    cursor?: string;
    matchingBracket?: string;
    panelBg?: string;
    border?: string;
  },
) {
  const bg = theme.background;
  const fg = theme.foreground;
  const line = theme.activeLine ?? (dark ? "#ffffff08" : "#00000006");
  const gutter = theme.gutterBg ?? bg;
  const gutterFg = theme.gutterFg ?? (dark ? "#555" : "#999");
  const selection = theme.selection ?? (dark ? "#ffffff20" : "#00000015");
  const cursor = theme.cursor ?? fg;
  const matching = theme.matchingBracket ?? (dark ? "#ffffff15" : "#00000012");
  const panelBg = theme.panelBg ?? (dark ? "#1a1a1a" : "#f5f5f5");
  const border = theme.border ?? (dark ? "#2a2a2a" : "#e0e0e0");

  return {
    "&": {
      backgroundColor: bg,
      color: fg,
      fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
    },
    ".cm-content": {
      caretColor: cursor,
      fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: cursor,
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: selection },
    ".cm-activeLine": { backgroundColor: line },
    ".cm-activeLineGutter": { backgroundColor: line },
    ".cm-gutters": {
      backgroundColor: gutter,
      color: gutterFg,
      border: "none",
      borderRight: `1px solid ${border}`,
      fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 12px 0 8px",
      fontSize: "11px",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "transparent",
      border: "none",
      color: gutterFg,
    },
    ".cm-tooltip": {
      backgroundColor: panelBg,
      border: `1px solid ${border}`,
      color: fg,
      fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li": { padding: "4px 8px" },
      "& > ul > li[aria-selected]": { backgroundColor: selection },
    },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: matching,
      outline: "none",
    },
    ".cm-searchMatch": {
      backgroundColor: selection,
    },
    "&.cm-focused": {
      outline: "none",
    },
    "::-webkit-scrollbar": {
      width: "6px",
      height: "6px",
    },
    "::-webkit-scrollbar-thumb": {
      background: dark ? "#333" : "#ccc",
      borderRadius: "3px",
    },
    "::-webkit-scrollbar-thumb:hover": {
      background: dark ? "#555" : "#999",
    },
    "::-webkit-scrollbar-track": {
      background: "transparent",
    },
  };
}

/* ─── highlight style helpers ───────────────────────── */
function createHighlight(
  _dark: boolean,
  colors: {
    keyword?: string;
    string?: string;
    number?: string;
    comment?: string;
    variable?: string;
    functionName?: string;
    typeName?: string;
    tag?: string;
    attr?: string;
    constant?: string;
    operator?: string;
    bracket?: string;
  },
) {
  return syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.keyword, color: colors.keyword, fontWeight: "500" },
      { tag: tags.string, color: colors.string },
      { tag: tags.number, color: colors.number },
      { tag: tags.comment, color: colors.comment, fontStyle: "italic" },
      { tag: tags.variableName, color: colors.variable },
      { tag: tags.function(tags.variableName), color: colors.functionName },
      { tag: tags.typeName, color: colors.typeName },
      { tag: tags.tagName, color: colors.tag },
      { tag: tags.attributeName, color: colors.attr },
      { tag: tags.attributeValue, color: colors.string },
      { tag: tags.constant(tags.variableName), color: colors.constant },
      { tag: tags.operator, color: colors.operator },
      { tag: tags.bracket, color: colors.bracket },
      { tag: tags.meta, color: colors.comment },
      { tag: tags.propertyName, color: colors.functionName },
      { tag: tags.labelName, color: colors.variable },
      { tag: tags.modifier, color: colors.keyword },
      { tag: tags.regexp, color: colors.string },
      { tag: tags.link, color: colors.string, textDecoration: "underline" },
      { tag: tags.url, color: colors.comment, textDecoration: "underline" },
    ]),
  );
}

/* ─── theme builder ─────────────────────────────────── */
function buildTheme(
  dark: boolean,
  chrome: {
    background: string;
    foreground: string;
    activeLine?: string;
    gutterBg?: string;
    gutterFg?: string;
    selection?: string;
    cursor?: string;
    matchingBracket?: string;
    panelBg?: string;
    border?: string;
  },
  syntax: {
    keyword?: string;
    string?: string;
    number?: string;
    comment?: string;
    variable?: string;
    functionName?: string;
    typeName?: string;
    tag?: string;
    attr?: string;
    constant?: string;
    operator?: string;
    bracket?: string;
  },
): Extension[] {
  return [
    EditorView.theme(baseTheme(dark, chrome), { dark }),
    createHighlight(dark, syntax),
  ];
}

/* ─── theme definitions ─────────────────────────────── */
const ayuLight = buildTheme(false, {
  background: "#fafafa",
  foreground: "#5c6166",
  activeLine: "#f0f0f0",
  gutterBg: "#fafafa",
  gutterFg: "#8a9199",
  selection: "#d4d4d4",
  cursor: "#ffaa33",
  matchingBracket: "#e6e6e6",
  border: "#e8e8e8",
}, {
  keyword: "#994cc3",
  string: "#86b300",
  number: "#a37acc",
  comment: "#8a9199",
  variable: "#5c6166",
  functionName: "#f2ae49",
  typeName: "#55b4d4",
  tag: "#f07171",
  attr: "#399ee6",
  constant: "#a37acc",
  operator: "#5c6166",
  bracket: "#5c6166",
});

const ayuDark = buildTheme(true, {
  background: "#0a0e14",
  foreground: "#b3b1ad",
  activeLine: "#11161e",
  gutterBg: "#0a0e14",
  gutterFg: "#474b4e",
  selection: "#253340",
  cursor: "#ffaa33",
  matchingBracket: "#2a3a4a",
  border: "#1a1f28",
}, {
  keyword: "#ff8f40",
  string: "#c2d94c",
  number: "#d2a6ff",
  comment: "#5c6773",
  variable: "#b3b1ad",
  functionName: "#ffb454",
  typeName: "#59c2ff",
  tag: "#f07178",
  attr: "#39bae6",
  constant: "#d2a6ff",
  operator: "#b3b1ad",
  bracket: "#b3b1ad",
});

const vesper = buildTheme(true, {
  background: "#101010",
  foreground: "#e0e0e0",
  activeLine: "#1a1a1a",
  gutterBg: "#101010",
  gutterFg: "#555",
  selection: "#2a2a2a",
  cursor: "#ff8c00",
  matchingBracket: "#333",
  border: "#222",
}, {
  keyword: "#ff8c00",
  string: "#98c379",
  number: "#d19a66",
  comment: "#636d83",
  variable: "#e0e0e0",
  functionName: "#61afef",
  typeName: "#e5c07b",
  tag: "#e06c75",
  attr: "#56b6c2",
  constant: "#d19a66",
  operator: "#e0e0e0",
  bracket: "#e0e0e0",
});

const vercel = buildTheme(true, {
  background: "#09090b",
  foreground: "#fafafa",
  activeLine: "#18181b",
  gutterBg: "#09090b",
  gutterFg: "#52525b",
  selection: "#3f3f46",
  cursor: "#fafafa",
  matchingBracket: "#3f3f46",
  border: "#27272a",
}, {
  keyword: "#f472b6",
  string: "#a78bfa",
  number: "#fbbf24",
  comment: "#52525b",
  variable: "#fafafa",
  functionName: "#34d399",
  typeName: "#38bdf8",
  tag: "#f87171",
  attr: "#818cf8",
  constant: "#fbbf24",
  operator: "#fafafa",
  bracket: "#fafafa",
});

/* ─── wrap imported themes w/ font ──────────────────── */
function withMono(ext: Extension): Extension[] {
  return [
    ext,
    EditorView.theme({
      "&": { fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace' },
      ".cm-content": { fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace' },
      ".cm-gutters": { fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace' },
      ".cm-tooltip": { fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace' },
    }),
  ];
}

export const THEME_REGISTRY: Record<string, Extension | Extension[]> = {
  "one-dark": withMono(oneDark),
  "github-light": withMono(githubLight),
  "github-dark": withMono(githubDark),
  dracula: withMono(dracula),
  "ayu-light": ayuLight,
  "ayu-dark": ayuDark,
  vesper: vesper,
  vercel: vercel,
};

export const THEME_OPTIONS = [
  { key: "one-dark", label: "One Dark" },
  { key: "github-light", label: "GitHub Light" },
  { key: "github-dark", label: "GitHub Dark" },
  { key: "dracula", label: "Dracula" },
  { key: "ayu-light", label: "Ayu Light" },
  { key: "ayu-dark", label: "Ayu Dark" },
  { key: "vesper", label: "Vesper" },
  { key: "vercel", label: "Vercel" },
] as const;
