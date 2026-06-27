import { Icon as IconifyIcon } from "@iconify/react";
import type { ComponentProps } from "react";

export function Icon(props: ComponentProps<typeof IconifyIcon>) {
  return <IconifyIcon {...props} />;
}

const FILE_ICONS: Record<string, string> = {
  html: "vscode-icons:file-type-html",
  css: "vscode-icons:file-type-css",
  javascript: "vscode-icons:file-type-js",
  json: "vscode-icons:file-type-json",
  markdown: "vscode-icons:file-type-markdown",
};

export function getFileIcon(language: string | null): string {
  if (language && FILE_ICONS[language]) return FILE_ICONS[language]!;
  return "vscode-icons:default-file";
}
