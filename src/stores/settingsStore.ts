import { create } from "zustand";
import type { AppSettings, UiTheme, CursorStyle, CursorBlinking } from "@/types";

const STORAGE_KEY = "writecode-settings";

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AppSettings>;
      return {
        uiTheme: parsed.uiTheme ?? "dark",
        editorTheme: parsed.editorTheme ?? "one-dark",
        fontSize: parsed.fontSize ?? 14,
        fontFamily: parsed.fontFamily ?? "JetBrains Mono",
        tabSize: parsed.tabSize ?? 2,
        lineWrapping: parsed.lineWrapping ?? false,
        cursorStyle: parsed.cursorStyle ?? "line",
        cursorBlinking: parsed.cursorBlinking ?? "blink",
        showLineNumbers: parsed.showLineNumbers ?? true,
        highlightActiveLine: parsed.highlightActiveLine ?? true,
        bracketMatching: parsed.bracketMatching ?? true,
        autoSave: parsed.autoSave ?? false,
        autoSaveDelay: parsed.autoSaveDelay ?? 2000,
        indentGuides: parsed.indentGuides ?? false,
        codeFolding: parsed.codeFolding ?? true,
      };
    }
  } catch {
    // ignore
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return {
    uiTheme: prefersDark ? "dark" : "light",
    editorTheme: "one-dark",
    fontSize: 14,
    fontFamily: "JetBrains Mono",
    tabSize: 2,
    lineWrapping: false,
    cursorStyle: "line",
    cursorBlinking: "blink",
    showLineNumbers: true,
    highlightActiveLine: true,
    bracketMatching: true,
    autoSave: false,
    autoSaveDelay: 2000,
    indentGuides: false,
    codeFolding: true,
  };
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface SettingsStore extends AppSettings {
  setUiTheme: (theme: UiTheme) => void;
  setEditorTheme: (theme: string) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setTabSize: (size: number) => void;
  setLineWrapping: (wrap: boolean) => void;
  setCursorStyle: (style: CursorStyle) => void;
  setCursorBlinking: (blink: CursorBlinking) => void;
  setShowLineNumbers: (show: boolean) => void;
  setHighlightActiveLine: (highlight: boolean) => void;
  setBracketMatching: (match: boolean) => void;
  setAutoSave: (save: boolean) => void;
  setAutoSaveDelay: (delay: number) => void;
  setIndentGuides: (guides: boolean) => void;
  setCodeFolding: (fold: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...loadSettings(),

  setUiTheme: (uiTheme) => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(uiTheme);
    set({ uiTheme });
    saveSettings({ ...get(), uiTheme });
  },

  setEditorTheme: (editorTheme) => {
    set({ editorTheme });
    saveSettings({ ...get(), editorTheme });
  },

  setFontSize: (fontSize) => {
    set({ fontSize });
    saveSettings({ ...get(), fontSize });
  },

  setFontFamily: (fontFamily) => {
    set({ fontFamily });
    saveSettings({ ...get(), fontFamily });
  },

  setTabSize: (tabSize) => {
    set({ tabSize });
    saveSettings({ ...get(), tabSize });
  },

  setLineWrapping: (lineWrapping) => {
    set({ lineWrapping });
    saveSettings({ ...get(), lineWrapping });
  },

  setCursorStyle: (cursorStyle) => {
    set({ cursorStyle });
    saveSettings({ ...get(), cursorStyle });
  },

  setCursorBlinking: (cursorBlinking) => {
    set({ cursorBlinking });
    saveSettings({ ...get(), cursorBlinking });
  },

  setShowLineNumbers: (showLineNumbers) => {
    set({ showLineNumbers });
    saveSettings({ ...get(), showLineNumbers });
  },

  setHighlightActiveLine: (highlightActiveLine) => {
    set({ highlightActiveLine });
    saveSettings({ ...get(), highlightActiveLine });
  },

  setBracketMatching: (bracketMatching) => {
    set({ bracketMatching });
    saveSettings({ ...get(), bracketMatching });
  },

  setAutoSave: (autoSave) => {
    set({ autoSave });
    saveSettings({ ...get(), autoSave });
  },

  setAutoSaveDelay: (autoSaveDelay) => {
    set({ autoSaveDelay });
    saveSettings({ ...get(), autoSaveDelay });
  },

  setIndentGuides: (indentGuides) => {
    set({ indentGuides });
    saveSettings({ ...get(), indentGuides });
  },

  setCodeFolding: (codeFolding) => {
    set({ codeFolding });
    saveSettings({ ...get(), codeFolding });
  },
}));
