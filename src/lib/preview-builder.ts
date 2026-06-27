import { extname, dirname, join } from "./path-utils";
import type { ProjectFile } from "@/types";

interface ResolvedAssets {
  cssBlobs: Map<string, string>;
  jsBlobs: Map<string, string>;
  importMap: Record<string, string>;
}

function normalizePath(p: string): string {
  return p.replace(/^\.\//, "").replace(/^\/+/, "");
}

function resolveRelative(from: string, to: string): string {
  if (to.startsWith("http://") || to.startsWith("https://") || to.startsWith("data:") || to.startsWith("blob:")) {
    return to;
  }
  const dir = dirname(from);
  return normalizePath(join(dir, to));
}

function rewriteCSS(css: string, filePath: string, assets: ResolvedAssets): string {
  css = css.replace(
    /@import\s+(?:url\(["']?([^"'\s)]+)["']?\)|["']([^"'\s)]+)["'])\s*;?/gi,
    (match: string, url1: string | undefined, url2: string | undefined) => {
      const importPath = url1 || url2 || "";
      const resolved = resolveRelative(filePath, importPath);
      const isExternal = importPath.startsWith("http://") || importPath.startsWith("https://");
      if (isExternal) return match;
      const blobUrl = assets.cssBlobs.get(resolved) || assets.cssBlobs.get(normalizePath(importPath));
      if (blobUrl) return `@import url('${blobUrl}');`;
      return match;
    },
  );
  css = css.replace(
    /url\((["']?)([^"'\s)]+)\1\)/gi,
    (match: string, _quote: string, urlPath: string) => {
      if (urlPath.startsWith("http://") || urlPath.startsWith("https://") || urlPath.startsWith("data:") || urlPath.startsWith("blob:")) {
        return match;
      }
      const resolved = resolveRelative(filePath, urlPath);
      const blobUrl = assets.cssBlobs.get(resolved) || assets.cssBlobs.get(normalizePath(urlPath));
      if (blobUrl) return `url('${blobUrl}')`;
      return match;
    },
  );
  return css;
}

function buildAssetUrls(files: ProjectFile[]): ResolvedAssets {
  const cssBlobs = new Map<string, string>();
  const jsBlobs = new Map<string, string>();
  const importMap: Record<string, string> = {};

  for (const file of files) {
    if (file.type !== "file") continue;
    const ext = extname(file.path);

    if (ext === ".css") {
      const blob = new Blob([file.content], { type: "text/css" });
      const url = URL.createObjectURL(blob);
      cssBlobs.set(file.path, url);
    } else if (ext === ".js" || ext === ".mjs") {
      const blob = new Blob([file.content], {
        type: "application/javascript",
      });
      const url = URL.createObjectURL(blob);
      jsBlobs.set(file.path, url);
      importMap[`./${file.path}`] = url;
    }
  }

  for (const file of files) {
    if (file.type !== "file") continue;
    const ext = extname(file.path);
    if (ext === ".css" && cssBlobs.has(file.path)) {
      const rewritten = rewriteCSS(file.content, file.path, { cssBlobs, jsBlobs, importMap });
      const blob = new Blob([rewritten], { type: "text/css" });
      const url = URL.createObjectURL(blob);
      URL.revokeObjectURL(cssBlobs.get(file.path)!);
      cssBlobs.set(file.path, url);
    }
  }

  return { cssBlobs, jsBlobs, importMap };
}

function revokeAssetUrls(assets: ResolvedAssets): void {
  for (const url of assets.cssBlobs.values()) {
    URL.revokeObjectURL(url);
  }
  for (const url of assets.jsBlobs.values()) {
    URL.revokeObjectURL(url);
  }
}

function escapeSrcAttribute(value: string): string {
  return value.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function buildPreviewDocument(
  files: ProjectFile[],
  entryPath: string,
): string {
  const entry = files.find(
    (f) => f.path === entryPath && f.type === "file",
  );

  if (!entry) {
    throw new Error(
      `Entry file "${entryPath}" not found in project files`,
    );
  }

  const assets = buildAssetUrls(files);
  let html = entry.content;

  const hasModuleScripts =
    html.includes('<script type="module"') ||
    html.includes("import ") ||
    Object.keys(assets.importMap).length > 0;

  if (hasModuleScripts && Object.keys(assets.importMap).length > 0) {
    const importMapJson = JSON.stringify(assets.importMap, null, 2);
    const importMapTag = `<script type="importmap">\n${importMapJson}\n</script>`;

    html = html.replace(
      /<script(?![^>]*src\s*=)([^>]*)>/i,
      `${importMapTag}<script$1>`,
    );

    if (!html.includes("importmap")) {
      html = html.replace(
        "</head>",
        `${importMapTag}\n</head>`,
      );
    }
  }

  html = html.replace(
    /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi,
    (match, hrefValue: string) => {
      const normalized = normalizePath(hrefValue);
      const blobUrl = assets.cssBlobs.get(normalized) || assets.cssBlobs.get(hrefValue);
      if (blobUrl) {
        return match.replace(
          `href="${escapeSrcAttribute(hrefValue)}"`,
          `href="${blobUrl}"`,
        );
      }
      return match;
    },
  );

  html = html.replace(
    /<script\s+([^>]*?)src=["']([^"']+)["']([^>]*?)><\/script>/gi,
    (match, before: string, srcValue: string, after: string) => {
      const isModule = before.includes("type=\"module\"") || after.includes("type=\"module\"");
      const normalized = normalizePath(srcValue);
      const blobUrl = assets.jsBlobs.get(normalized) || assets.jsBlobs.get(srcValue);

      if (blobUrl) {
        const moduleAttr = isModule ? "" : ' type="module"';
        return `<script${before} src="${blobUrl}"${moduleAttr}${after}></script>`;
      }

      return match;
    },
  );

  return html;
}

export { revokeAssetUrls };
