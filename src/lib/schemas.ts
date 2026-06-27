import { z } from "zod";

export const uiThemeSchema = z.enum(["light", "dark"]);

export const languageSchema = z.enum([
  "html",
  "css",
  "javascript",
  "json",
  "markdown",
]);

export const projectFileTypeSchema = z.enum(["file", "folder"]);

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(128),
  entryFile: z.string().min(1),
  uiTheme: uiThemeSchema,
  editorTheme: z.string().min(1),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const projectFileSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  path: z.string().min(1),
  type: projectFileTypeSchema,
  content: z.string(),
  language: languageSchema.nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const newProjectSchema = z.object({
  name: z.string().min(1).max(128),
});

export const newFileSchema = z.object({
  path: z.string().min(1),
  type: projectFileTypeSchema,
  language: languageSchema.nullable(),
});

export const exportProjectSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  project: projectSchema,
  files: z.array(projectFileSchema),
});

export type ExportProjectPayload = z.infer<typeof exportProjectSchema>;
