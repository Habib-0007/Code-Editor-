import { describe, it, expect } from "vitest";
import {
  join,
  dirname,
  basename,
  extname,
  languageFromPath,
  renamePath,
  parentPath,
  addChildPath,
} from "@/lib/path-utils";

describe("join", () => {
  it("joins path segments", () => {
    expect(join("a", "b", "c")).toBe("a/b/c");
  });

  it("handles empty segments", () => {
    expect(join("a", "", "b")).toBe("a/b");
  });

  it("removes trailing slash", () => {
    expect(join("a", "b/")).toBe("a/b");
  });
});

describe("dirname", () => {
  it("returns parent directory", () => {
    expect(dirname("a/b/c.html")).toBe("a/b");
  });

  it("returns empty for root file", () => {
    expect(dirname("index.html")).toBe("");
  });
});

describe("basename", () => {
  it("returns the filename", () => {
    expect(basename("a/b/c.html")).toBe("c.html");
  });

  it("returns the name for root file", () => {
    expect(basename("index.html")).toBe("index.html");
  });
});

describe("extname", () => {
  it("returns extension", () => {
    expect(extname("style.css")).toBe(".css");
  });

  it("returns empty for no extension", () => {
    expect(extname("Makefile")).toBe("");
  });
});

describe("languageFromPath", () => {
  it("detects html", () => {
    expect(languageFromPath("index.html")).toBe("html");
  });

  it("detects css", () => {
    expect(languageFromPath("styles/main.css")).toBe("css");
  });

  it("detects javascript", () => {
    expect(languageFromPath("script.js")).toBe("javascript");
    expect(languageFromPath("app.mjs")).toBe("javascript");
  });

  it("detects json", () => {
    expect(languageFromPath("data.json")).toBe("json");
  });

  it("detects markdown", () => {
    expect(languageFromPath("README.md")).toBe("markdown");
  });

  it("returns null for unknown", () => {
    expect(languageFromPath("file.txt")).toBeNull();
  });
});

describe("renamePath", () => {
  it("renames the last segment", () => {
    expect(renamePath("a/b/old.js", "new.js")).toBe("a/b/new.js");
  });

  it("renames root file", () => {
    expect(renamePath("old.js", "new.js")).toBe("new.js");
  });
});

describe("parentPath", () => {
  it("returns parent path", () => {
    expect(parentPath("a/b/c")).toBe("a/b");
  });
});

describe("addChildPath", () => {
  it("adds child to parent", () => {
    expect(addChildPath("src", "components")).toBe("src/components");
  });

  it("handles root parent", () => {
    expect(addChildPath("", "file.js")).toBe("file.js");
  });
});
