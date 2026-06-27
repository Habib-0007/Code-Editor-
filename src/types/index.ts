export interface Project {
  id: string;
  name: string;
  entryFile: string;
  uiTheme: "light" | "dark";
  editorTheme: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  type: "file" | "folder";
  content: string;
  language: "html" | "css" | "javascript" | "json" | "markdown" | null;
  createdAt: number;
  updatedAt: number;
}

export interface OpenTab {
  fileId: string;
  path: string;
  language: ProjectFile["language"];
  dirty: boolean;
}

export interface FileTreeNode {
  id: string;
  path: string;
  name: string;
  type: "file" | "folder";
  language: ProjectFile["language"];
  children: FileTreeNode[];
  depth: number;
}

export type UiTheme = "light" | "dark";

export type EditorThemeKey = string;

export type CursorStyle = "line" | "block" | "underline";
export type CursorBlinking = "blink" | "smooth" | "phase" | "solid";

export interface AppSettings {
  uiTheme: UiTheme;
  editorTheme: EditorThemeKey;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  lineWrapping: boolean;
  cursorStyle: CursorStyle;
  cursorBlinking: CursorBlinking;
  showLineNumbers: boolean;
  highlightActiveLine: boolean;
  bracketMatching: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  indentGuides: boolean;
  codeFolding: boolean;
}
