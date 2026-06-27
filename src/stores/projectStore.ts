import { create } from "zustand";
import type { Project } from "@/types";
import { getAllProjects, getProjectFileCount } from "@/db";
import { logger } from "@/lib/logger";

interface ProjectWithStats extends Project {
  fileCount: number;
}

interface ProjectStore {
  projects: ProjectWithStats[];
  loading: boolean;
  loadProjects: () => Promise<void>;
  setProjects: (projects: ProjectWithStats[]) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  loading: true,
  loadProjects: async () => {
    try {
      const projects = await getAllProjects();
      const withCounts = await Promise.all(
        projects.map(async (p) => ({
          ...p,
          fileCount: await getProjectFileCount(p.id),
        })),
      );
      set({ projects: withCounts, loading: false });
    } catch (error) {
      logger.error("Failed to load projects", error);
      set({ loading: false });
    }
  },
  setProjects: (projects) => set({ projects }),
}));
