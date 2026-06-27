import { create } from "zustand";
import type { ProjectFile, OpenTab } from "@/types";
import { getProjectFiles, updateFile } from "@/db";

interface WorkspaceStore {
  projectId: string | null;
  files: ProjectFile[];
  tabs: OpenTab[];
  activeFileId: string | null;
  loading: boolean;

  setProjectId: (id: string | null) => void;
  loadFiles: (projectId: string) => Promise<void>;
  setFiles: (files: ProjectFile[]) => void;
  openFile: (fileId: string, path: string, language: ProjectFile["language"]) => void;
  closeTab: (fileId: string) => void;
  setActiveFile: (fileId: string | null) => void;
  setTabDirty: (fileId: string, dirty: boolean) => void;
  updateFileContent: (fileId: string, content: string) => Promise<void>;
  addFile: (file: ProjectFile) => void;
  removeFile: (fileId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  projectId: null,
  files: [],
  tabs: [],
  activeFileId: null,
  loading: false,

  setProjectId: (id) => set({ projectId: id }),

  loadFiles: async (projectId) => {
    set({ loading: true });
    const files = await getProjectFiles(projectId);
    set({ files, loading: false, projectId });
  },

  setFiles: (files) => set({ files }),

  openFile: (fileId, path, language) => {
    const { tabs } = get();
    if (tabs.some((t) => t.fileId === fileId)) {
      set({ activeFileId: fileId });
      return;
    }
    set({
      tabs: [...tabs, { fileId, path, language, dirty: false }],
      activeFileId: fileId,
    });
  },

  closeTab: (fileId) => {
    const { tabs, activeFileId } = get();
    const newTabs = tabs.filter((t) => t.fileId !== fileId);
    let newActive = activeFileId;
    if (activeFileId === fileId) {
      const idx = tabs.findIndex((t) => t.fileId === fileId);
      newActive =
        newTabs[Math.min(idx, newTabs.length - 1)]?.fileId ?? null;
    }
    set({ tabs: newTabs, activeFileId: newActive });
  },

  setActiveFile: (fileId) => set({ activeFileId: fileId }),

  setTabDirty: (fileId, dirty) => {
    const { tabs } = get();
    set({
      tabs: tabs.map((t) => (t.fileId === fileId ? { ...t, dirty } : t)),
    });
  },

  updateFileContent: async (fileId, content) => {
    await updateFile(fileId, { content });
    const { files } = get();
    set({
      files: files.map((f) =>
        f.id === fileId ? { ...f, content, updatedAt: Date.now() } : f,
      ),
    });
  },

  addFile: (file) => {
    const { files } = get();
    set({ files: [...files, file] });
  },

  removeFile: (fileId) => {
    const { files, tabs } = get();
    set({
      files: files.filter((f) => f.id !== fileId),
      tabs: tabs.filter((t) => t.fileId !== fileId),
    });
  },
}));
