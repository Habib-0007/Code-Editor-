import { useCallback, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { CodeEditor, type CodeEditorHandle } from "./CodeEditor";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { KeyboardToolbar } from "./KeyboardToolbar";
import { getFileIcon } from "@/lib/icons";

interface EditorPaneProps {
  editorTheme: string;
  fontSize: number;
}

export function EditorPane({ editorTheme, fontSize }: EditorPaneProps) {
  const { tabs, activeFileId, files, closeTab, setActiveFile, updateFileContent } =
    useWorkspaceStore();
  const settings = useSettingsStore();
  const editorRef = useRef<CodeEditorHandle>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const activeFile = files.find((f) => f.id === activeFileId);

  const handleContentChange = useCallback(
    (content: string) => {
      if (!activeFileId) return;
      updateFileContent(activeFileId, content);
    },
    [activeFileId, updateFileContent],
  );

  if (tabs.length === 0) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center justify-end border-b border-border bg-surface px-3 py-2 shrink-0">
          <button
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard shortcuts"
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors duration-100 hover:bg-surface-hover hover:text-foreground"
          >
            <Icon icon="ph:keyboard" className="w-2.5 h-2.5" />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 text-center max-w-[240px]">
            <div className="rounded-xl border border-border/60 bg-surface p-4">
              <Icon icon="ph:files" className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">No file open</p>
              <p className="text-xs text-muted-foreground">
                Select a file from the explorer to start editing
              </p>
            </div>
          </div>
        </div>
        <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex overflow-x-auto border-b border-border bg-surface scrollbar-none shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.fileId === activeFileId;
          const fileName = tab.path.split("/").pop();
          return (
            <button
              key={tab.fileId}
              onClick={() => setActiveFile(tab.fileId)}
              className={`
                group relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5
                text-xs border-r border-border transition-colors duration-100 shrink-0
                sm:gap-2 sm:px-4
                ${isActive
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                }
              `}
            >
              <Icon icon={getFileIcon(tab.language)} className="w-3.5 h-3.5 shrink-0" />
              {tab.dirty && (
                <Icon
                  icon="ph:circle"
                  className="w-1 h-1 fill-current animate-dirty-pulse shrink-0"
                />
              )}
              <span className="truncate max-w-[80px] sm:max-w-[120px]">{fileName}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.fileId);
                }}
                className={`
                  flex h-4 w-4 shrink-0 items-center justify-center rounded-sm
                  opacity-0 transition-opacity duration-100
                  hover:bg-surface-hover group-hover:opacity-100
                  ${isActive ? "opacity-50" : ""}
                `}
              >
                <Icon icon="ph:x" className="w-2.5 h-2.5" />
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          );
        })}
        <div className="flex items-center px-2 ml-auto">
          <button
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard shortcuts"
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors duration-100 hover:bg-surface-hover hover:text-foreground"
          >
            <Icon icon="ph:keyboard" className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeFile && (
          <CodeEditor
            ref={editorRef}
            key={activeFile.id}
            value={activeFile.content}
            language={activeFile.language}
            theme={editorTheme}
            fontSize={fontSize}
            fontFamily={settings.fontFamily}
            tabSize={settings.tabSize}
            lineWrapping={settings.lineWrapping}
            cursorStyle={settings.cursorStyle}
            cursorBlinking={settings.cursorBlinking}
            showLineNumbers={settings.showLineNumbers}
            highlightActiveLineEnabled={settings.highlightActiveLine}
            bracketMatchingEnabled={settings.bracketMatching}
            indentGuides={settings.indentGuides}
            codeFolding={settings.codeFolding}
            onChange={handleContentChange}
          />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-surface px-3 py-1 shrink-0 text-[10px] text-muted-foreground/50">
        <div className="flex items-center gap-3">
          <span>Tab: {activeFile ? "2 spaces" : "—"}</span>
          <span>Ln {activeFile ? (activeFile.content.split("\n").length) : "—"} Col 1</span>
        </div>
      </div>

      <KeyboardToolbar
        onInsertText={(text) => editorRef.current?.insertText(text)}
        onUndo={() => editorRef.current?.undo()}
        onRedo={() => editorRef.current?.redo()}
        onShortcutsOpen={() => setShortcutsOpen(true)}
      />

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
