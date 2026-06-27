export function join(...segments: string[]): string {
  return segments
    .filter(Boolean)
    .join("/")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");
}

export function dirname(path: string): string {
  const parts = path.split("/");
  if (parts.length <= 1) return "";
  parts.pop();
  return parts.join("/") || "";
}

export function basename(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? "";
}

export function extname(path: string): string {
  const base = basename(path);
  const dotIdx = base.lastIndexOf(".");
  if (dotIdx === -1) return "";
  return base.slice(dotIdx);
}

export function languageFromPath(
  path: string,
): "html" | "css" | "javascript" | "json" | "markdown" | null {
  const ext = extname(path);
  switch (ext) {
    case ".html":
      return "html";
    case ".css":
      return "css";
    case ".js":
    case ".mjs":
      return "javascript";
    case ".json":
      return "json";
    case ".md":
      return "markdown";
    default:
      return null;
  }
}

export function renamePath(
  oldPath: string,
  newName: string,
): string {
  const parts = oldPath.split("/");
  parts[parts.length - 1] = newName;
  return parts.join("/");
}

export function parentPath(path: string): string {
  return dirname(path);
}

export function addChildPath(parent: string, childName: string): string {
  return parent ? `${parent}/${childName}` : childName;
}
