import Dexie, { type Table } from "dexie";
import { v4 as uuid } from "uuid";
import { projectSchema, projectFileSchema, exportProjectSchema } from "@/lib/schemas";
import type { ExportProjectPayload } from "@/lib/schemas";
import type { Project, ProjectFile } from "@/types";

class WriteCodeDB extends Dexie {
  projects!: Table<Project, string>;
  files!: Table<ProjectFile, string>;

  constructor() {
    super("writecode");
    this.version(1).stores({
      projects: "id, name, createdAt, updatedAt",
      files: "id, projectId, path, [projectId+path]",
    });
  }
}

export const db = new WriteCodeDB();

export async function createProject(name: string): Promise<Project> {
  const now = Date.now();
  const project: Project = {
    id: uuid(),
    name,
    entryFile: "index.html",
    uiTheme: "dark",
    editorTheme: "one-dark",
    createdAt: now,
    updatedAt: now,
  };

  const parsed = projectSchema.parse(project);
  await db.projects.add(parsed);

  const files: ProjectFile[] = [
    {
      id: uuid(),
      projectId: project.id,
      path: "index.html",
      type: "file",
      content:
        '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css" />\n</head>\n<body>\n  <h1>Hello, WriteCode!</h1>\n  <script src="script.js"></script>\n</body>\n</html>\n',
      language: "html",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      projectId: project.id,
      path: "style.css",
      type: "file",
      content:
        "* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  background: #111113;\n  color: #ededef;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n}\n\nh1 {\n  font-size: 2rem;\n  font-weight: 600;\n  letter-spacing: -0.03em;\n  padding: 2rem;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 12px;\n  background: rgba(255, 255, 255, 0.03);\n  text-align: center;\n}\n",
      language: "css",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      projectId: project.id,
      path: "script.js",
      type: "file",
      content:
        'console.log("Hello from WriteCode!");\n\ndocument.addEventListener("DOMContentLoaded", () => {\n  const h1 = document.querySelector("h1");\n  if (h1) {\n    h1.addEventListener("click", () => {\n      h1.textContent = "Clicked!";\n    });\n  }\n});\n',
      language: "javascript",
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const file of files) {
    const parsedFile = projectFileSchema.parse(file);
    await db.files.add(parsedFile);
  }

  return project;
}

export async function updateProject(
  id: string,
  updates: Partial<Project>,
): Promise<void> {
  const parsed = projectSchema.partial().parse(updates);
  await db.projects.update(id, { ...parsed, updatedAt: Date.now() });
}

export async function deleteProject(id: string): Promise<void> {
  await db.files.where("projectId").equals(id).delete();
  await db.projects.delete(id);
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id);
}

export async function getAllProjects(): Promise<Project[]> {
  return db.projects.orderBy("updatedAt").reverse().toArray();
}

export async function createFile(
  projectId: string,
  path: string,
  type: "file" | "folder",
  language: ProjectFile["language"],
  content = "",
): Promise<ProjectFile> {
  const now = Date.now();
  const file: ProjectFile = {
    id: uuid(),
    projectId,
    path,
    type,
    content,
    language,
    createdAt: now,
    updatedAt: now,
  };

  const parsed = projectFileSchema.parse(file);
  await db.files.add(parsed);
  return parsed;
}

export async function updateFile(
  id: string,
  updates: Partial<ProjectFile>,
): Promise<void> {
  const parsed = projectFileSchema.partial().parse(updates);
  await db.files.update(id, { ...parsed, updatedAt: Date.now() });
}

export async function deleteFile(id: string): Promise<void> {
  await db.files.delete(id);
}

export async function getProjectFileCount(
  projectId: string,
): Promise<number> {
  return db.files.where("projectId").equals(projectId).count();
}

export async function getProjectFiles(
  projectId: string,
): Promise<ProjectFile[]> {
  return db.files.where("projectId").equals(projectId).toArray();
}

export async function getFileByPath(
  projectId: string,
  path: string,
): Promise<ProjectFile | undefined> {
  return db.files
    .where("[projectId+path]")
    .equals([projectId, path])
    .first();
}

export async function renameFile(
  fileId: string,
  newPath: string,
  newLanguage: ProjectFile["language"],
): Promise<void> {
  await db.files.update(fileId, {
    path: newPath,
    language: newLanguage,
    updatedAt: Date.now(),
  });
}

export async function duplicateProject(
  projectId: string,
): Promise<Project | undefined> {
  const project = await getProject(projectId);
  if (!project) return undefined;

  const files = await getProjectFiles(projectId);

  const newProject = await createProject(`${project.name} (copy)`);

  for (const file of files) {
    const parsed = projectFileSchema.parse({
      ...file,
      id: uuid(),
      projectId: newProject.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await db.files.add(parsed);
  }

  return newProject;
}

export async function exportProjectAsJson(
  projectId: string,
): Promise<string | undefined> {
  const project = await getProject(projectId);
  if (!project) return undefined;

  const files = await getProjectFiles(projectId);

  return JSON.stringify(
    {
      version: 1,
      exportedAt: Date.now(),
      project,
      files,
    },
    null,
    2,
  );
}

export async function importProjectFromJson(
  json: string,
): Promise<Project> {
  let parsed: ExportProjectPayload;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON");
  }

  const validated = exportProjectSchema.parse(parsed);

  const projectData = validated.project;
  const newProjectId = uuid();
  const now = Date.now();

  const newProject: Project = {
    ...projectData,
    id: newProjectId,
    name: projectData.name,
    updatedAt: now,
    createdAt: now,
  };

  await db.projects.add(newProject);

  for (const file of validated.files) {
    const newFile: ProjectFile = {
      ...file,
      id: uuid(),
      projectId: newProjectId,
      createdAt: now,
      updatedAt: now,
    };
    await db.files.add(newFile);
  }

  return newProject;
}
