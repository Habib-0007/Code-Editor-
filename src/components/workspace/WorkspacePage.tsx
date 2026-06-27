import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { Icon } from "@iconify/react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { getProject } from "@/db";
import { FileTree } from "./FileTree";
import { EditorPane } from "../editor/EditorPane";
import { PreviewPane } from "../preview/PreviewPane";
import type { Project } from "@/types";

type MobilePanel = "files" | "editor" | "preview";

export function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { loadFiles, files, loading: filesLoading, openFile } = useWorkspaceStore();
  const [project, setProject] = useState<Project | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(
    (searchParams.get("panel") as MobilePanel) || "editor",
  );
  const editorTheme = useSettingsStore((s) => s.editorTheme);
  const fontSize = useSettingsStore((s) => s.fontSize);

  useEffect(() => {
    if (!projectId) return;
    const init = async () => {
      const p = await getProject(projectId);
      if (!p) {
        navigate("/", { replace: true });
        return;
      }
      setProject(p);
      await loadFiles(projectId);

      const fileParam = searchParams.get("file");
      if (fileParam) {
        const target = files.find((f) => f.path === fileParam || f.id === fileParam);
        if (target) {
          openFile(target.id, target.path, target.language);
        }
      }
    };
    init();
  }, [projectId, loadFiles, navigate]);

  const handleMobilePanelChange = useCallback((panel: MobilePanel) => {
    setMobilePanel(panel);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("panel", panel);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  if (!project || filesLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground animate-fade-in">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
      </div>
    );
  }

  const mobileTabs: { key: MobilePanel; icon: string; label: string }[] = [
    { key: "files", icon: "ph:tree-structure", label: "Files" },
    { key: "editor", icon: "ph:code", label: "Editor" },
    { key: "preview", icon: "ph:eye", label: "Preview" },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden animate-fade-in">
      <div className="hidden md:flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <FileTree projectId={project.id} />
          </Panel>
          <PanelResizeHandle className="resize-handle" />
          <Panel defaultSize={45} minSize={30}>
            <EditorPane editorTheme={editorTheme} fontSize={fontSize} />
          </Panel>
          <PanelResizeHandle className="resize-handle" />
          <Panel defaultSize={35} minSize={20}>
            <PreviewPane files={files} entryFile={project.entryFile} />
          </Panel>
        </PanelGroup>
      </div>

      <div className="flex flex-col flex-1 md:hidden overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {mobilePanel === "files" && (
            <FileTree
              projectId={project.id}
              onFileOpen={() => handleMobilePanelChange("editor")}
            />
          )}
          {mobilePanel === "editor" && <EditorPane editorTheme={editorTheme} fontSize={fontSize} />}
          {mobilePanel === "preview" && (
            <PreviewPane files={files} entryFile={project.entryFile} />
          )}
        </div>

        <nav className="flex border-t border-border bg-surface shrink-0">
          {mobileTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleMobilePanelChange(tab.key)}
              className={`
                flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium
                transition-colors duration-100
                ${mobilePanel === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground"
                }
              `}
            >
              <Icon
                icon={tab.icon}
                className="w-4 h-4"
                strokeWidth={mobilePanel === tab.key ? "2" : "1.5"}
              />
              {tab.label}
              {mobilePanel === tab.key && (
                <span className="h-0.5 w-3 rounded-full bg-foreground" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
