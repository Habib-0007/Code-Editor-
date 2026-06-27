import { describe, it, expect } from "vitest";
import { buildPreviewDocument } from "@/lib/preview-builder";
import type { ProjectFile } from "@/types";

function makeFile(
  path: string,
  content: string,
  language: ProjectFile["language"],
  type: "file" | "folder" = "file",
): ProjectFile {
  return {
    id: `test-${path}`,
    projectId: "test-project",
    path,
    content,
    language,
    type,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("buildPreviewDocument", () => {
  it("throws when entry file is missing", () => {
    expect(() => buildPreviewDocument([], "index.html")).toThrow(
      'Entry file "index.html" not found',
    );
  });

  it("returns the entry HTML as-is when there are no linked assets", () => {
    const files = [makeFile("index.html", "<h1>Hello</h1>", "html")];
    const result = buildPreviewDocument(files, "index.html");
    expect(result).toBe("<h1>Hello</h1>");
  });

  it("replaces CSS link hrefs with blob URLs", () => {
    const files = [
      makeFile(
        "index.html",
        '<html><head><link rel="stylesheet" href="style.css"></head><body></body></html>',
        "html",
      ),
      makeFile("style.css", "body { color: red; }", "css"),
    ];

    const result = buildPreviewDocument(files, "index.html");
    expect(result).toContain('href="blob:');
    expect(result).not.toContain('href="style.css"');
  });

  it("replaces JS script src with blob URLs and adds type=module", () => {
    const files = [
      makeFile(
        "index.html",
        '<html><head><script src="app.js"></script></head><body></body></html>',
        "html",
      ),
      makeFile("app.js", 'console.log("hello")', "javascript"),
    ];

    const result = buildPreviewDocument(files, "index.html");
    expect(result).toContain('src="blob:');
    expect(result).toContain('type="module"');
  });

  it("injects importmap when JS files exist", () => {
    const files = [
      makeFile(
        "index.html",
        '<html><head><script type="module" src="main.js"></script></head><body></body></html>',
        "html",
      ),
      makeFile("main.js", 'import "./utils.js"', "javascript"),
      makeFile("utils.js", 'export const x = 1', "javascript"),
    ];

    const result = buildPreviewDocument(files, "index.html");
    expect(result).toContain("importmap");
    expect(result).toContain("./utils.js");
    expect(result).toContain("blob:");
  });

  it("handles nested folder paths", () => {
    const files = [
      makeFile(
        "index.html",
        '<html><head><link rel="stylesheet" href="styles/main.css"></head><body></body></html>',
        "html",
      ),
      makeFile("styles/main.css", "body { color: blue; }", "css"),
    ];

    const result = buildPreviewDocument(files, "index.html");
    expect(result).toContain('href="blob:');
    expect(result).not.toContain('href="styles/main.css"');
  });

  it("preserves existing script attributes when rewriting src", () => {
    const files = [
      makeFile(
        "index.html",
        '<html><head><script defer src="app.js"></script></head><body></body></html>',
        "html",
      ),
      makeFile("app.js", 'console.log("test")', "javascript"),
    ];

    const result = buildPreviewDocument(files, "index.html");
    expect(result).toContain("defer");
    expect(result).toContain('src="blob:');
  });

  it("supports markdown files (no special handling needed)", () => {
    const files = [
      makeFile("index.html", "<h1>Hello</h1>", "html"),
      makeFile("README.md", "# Documentation", "markdown"),
    ];

    const result = buildPreviewDocument(files, "index.html");
    expect(result).toBe("<h1>Hello</h1>");
  });
});
