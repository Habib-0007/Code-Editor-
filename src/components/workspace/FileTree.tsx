import { useCallback, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { getFileIcon } from "@/lib/icons";
import {
  createFile,
  deleteFile,
  renameFile,
} from "@/db";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { languageFromPath } from "@/lib/path-utils";
import type { ProjectFile, FileTreeNode } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import {
  FieldGroup,
  Field,
  FieldLabel,
} from "@/components/ui/field";

interface FileTreeProps {
  projectId: string;
  onFileOpen?: () => void;
}

function formatSize(content: string): string {
  const bytes = new TextEncoder().encode(content).length;
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function buildTree(files: ProjectFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const map = new Map<string, FileTreeNode>();

  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sorted) {
    const parts = file.path.split("/");
    let currentPath = "";
    let parentNodes = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      if (!map.has(currentPath)) {
        const node: FileTreeNode = {
          id: isLast ? file.id : `${currentPath}-folder`,
          path: currentPath,
          name: part,
          type: isLast ? file.type : "folder",
          language: isLast ? file.language : null,
          children: [],
          depth: i,
        };
        map.set(currentPath, node);
        parentNodes.push(node);
      }

      const node = map.get(currentPath)!;
      if (isLast && file.type === "folder") {
        node.type = "folder";
        node.id = file.id;
      }
      parentNodes = node.children;
    }
  }

  return root;
}

interface TreeNodeProps {
  node: FileTreeNode;
  activeFileId: string | null;
  files: ProjectFile[];
  onSelect: (fileId: string, path: string, language: ProjectFile["language"]) => void;
  collapsed: Set<string>;
  toggleCollapse: (path: string) => void;
  onContextAction: (node: FileTreeNode, parentFolder: string) => void;
  onRename: (node: FileTreeNode) => void;
  onDelete: (node: FileTreeNode) => void;
  onNewFile: () => void;
  onNewFolder: () => void;
}

function TreeNode({
  node,
  activeFileId,
  files,
  onSelect,
  collapsed,
  toggleCollapse,
  onContextAction,
  onRename,
  onDelete,
  onNewFile,
  onNewFolder,
}: TreeNodeProps) {
  const isFolder = node.type === "folder";
  const isCollapsed = collapsed.has(node.path);
  const isActive = node.id === activeFileId;

  const file = files.find((f) => f.id === node.id);
  const fileSize = file ? formatSize(file.content) : null;

  const handleClick = () => {
    if (isFolder) {
      toggleCollapse(node.path);
    } else {
      onSelect(node.id, node.path, node.language);
    }
  };

  const getParentFolder = () => {
    if (node.type === "folder") return node.path;
    const parts = node.path.split("/");
    parts.pop();
    return parts.join("/");
  };

  return (
    <div className="animate-slide-in-right">
      <ContextMenu>
        <ContextMenuTrigger>
          <button
            onClick={handleClick}
            className={`
              group flex w-full items-center gap-2 rounded-md px-2 py-1.5 mx-1 text-sm
              transition-colors duration-100 cursor-pointer select-none text-left
              ${isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              }
            `}
            style={{ paddingLeft: node.depth * 16 + 8 }}
          >
            {isFolder ? (
              <Icon
                icon={isCollapsed ? "ph:folder" : "ph:folder-open"}
                className="w-3.5 h-3.5 shrink-0 opacity-60"
              />
            ) : (
              <Icon
                icon={getFileIcon(node.language)}
                className="w-4 h-4 shrink-0"
              />
            )}
            <span className="truncate flex-1 min-w-0">{node.name}</span>
            {fileSize && !isFolder && (
              <span className="text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground/60 shrink-0">
                {fileSize}
              </span>
            )}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => { onContextAction(node, getParentFolder()); onNewFile(); }}>
            <Icon icon="ph:plus" className="w-3.5 h-3.5" /> New File
          </ContextMenuItem>
          <ContextMenuItem onClick={() => { onContextAction(node, getParentFolder()); onNewFolder(); }}>
            <Icon icon="ph:plus" className="w-3.5 h-3.5" /> New Folder
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onRename(node)}>
            <Icon icon="ph:pencil-simple" className="w-3.5 h-3.5" /> Rename
          </ContextMenuItem>
          <ContextMenuItem variant="destructive" onClick={() => onDelete(node)}>
            <Icon icon="ph:trash" className="w-3.5 h-3.5" /> {isFolder ? "Delete Folder" : "Delete"}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {isFolder && !isCollapsed && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeFileId={activeFileId}
              files={files}
              onSelect={onSelect}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
              onContextAction={onContextAction}
              onRename={onRename}
              onDelete={onDelete}
              onNewFile={onNewFile}
              onNewFolder={onNewFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ projectId, onFileOpen }: FileTreeProps) {
  const { files, activeFileId, openFile, addFile, removeFile, loadFiles } =
    useWorkspaceStore();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [contextParentFolder, setContextParentFolder] = useState<string>("");
  const [showNewFile, setShowNewFile] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showRename, setShowRename] = useState<FileTreeNode | null>(null);
  const [showDelete, setShowDelete] = useState<FileTreeNode | null>(null);
  const [newName, setNewName] = useState("");
  const [renamedName, setRenamedName] = useState("");

  const tree = useMemo(() => buildTree(files), [files]);

  const toggleCollapse = useCallback((path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (fileId: string, path: string, language: ProjectFile["language"]) => {
      const file = files.find((f) => f.id === fileId);
      if (file && file.type === "folder") return;
      openFile(fileId, path, language);
      onFileOpen?.();
    },
    [files, openFile, onFileOpen],
  );

  const handleContextAction = useCallback(
    (_node: FileTreeNode, parentFolder: string) => {
      setContextParentFolder(parentFolder);
    },
    [],
  );

  const handleCreateFile = useCallback(async () => {
    if (!newName.trim()) return;
    const path = contextParentFolder
      ? `${contextParentFolder}/${newName.trim()}`
      : newName.trim();
    const language = languageFromPath(path);
    const file = await createFile(projectId, path, "file", language);
    addFile(file);
    setShowNewFile(false);
    setNewName("");
    openFile(file.id, file.path, file.language);
  }, [newName, contextParentFolder, projectId, addFile, openFile]);

  const handleCreateFolder = useCallback(async () => {
    if (!newName.trim()) return;
    const path = contextParentFolder
      ? `${contextParentFolder}/${newName.trim()}`
      : newName.trim();
    const file = await createFile(projectId, path, "folder", null, "");
    addFile(file);
    setShowNewFolder(false);
    setNewName("");
  }, [newName, contextParentFolder, projectId, addFile]);

  const handleRename = useCallback(async () => {
    if (!showRename || !renamedName.trim()) return;
    const parts = showRename.path.split("/");
    parts[parts.length - 1] = renamedName.trim();
    const newPath = parts.join("/");
    const newLang = languageFromPath(newPath);
    await renameFile(showRename.id, newPath, newLang);
    loadFiles(projectId);
    setShowRename(null);
    setRenamedName("");
  }, [showRename, renamedName, projectId, loadFiles]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!showDelete) return;
    await deleteFile(showDelete.id);
    removeFile(showDelete.id);

    if (showDelete.type === "folder") {
      const children = files.filter(
        (f) => f.path.startsWith(showDelete.path + "/") || f.path === showDelete.path,
      );
      for (const child of children) {
        await deleteFile(child.id);
        removeFile(child.id);
      }
      loadFiles(projectId);
    }

    setShowDelete(null);
  }, [showDelete, files, removeFile, loadFiles, projectId]);

  const handleRenameClick = useCallback((node: FileTreeNode) => {
    setShowRename(node);
    setRenamedName(node.name);
  }, []);

  const handleDeleteClick = useCallback((node: FileTreeNode) => {
    setShowDelete(node);
  }, []);

  const handleNewFileClick = useCallback(() => {
    setShowNewFile(true);
  }, []);

  const handleNewFolderClick = useCallback(() => {
    setShowNewFolder(true);
  }, []);

  return (
    <div className="flex h-full flex-col bg-background md:border-r md:border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Files
        </span>
        <button
          onClick={handleNewFileClick}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-surface-hover hover:text-foreground"
          title="New file"
        >
          <Icon icon="ph:plus" className="w-3 h-3" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 px-4 pt-12 text-center">
            <div className="rounded-lg border border-border/50 bg-surface p-3">
              <Icon icon="ph:file" className="w-5 h-5 text-muted-foreground/30" />
            </div>
            <p className="text-xs text-muted-foreground">No files yet</p>
            <Button variant="outline" size="sm" onClick={handleNewFileClick} className="gap-1.5 h-7 text-xs">
              <Icon icon="ph:plus" className="w-3 h-3" />
              Create file
            </Button>
          </div>
        ) : (
          tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              activeFileId={activeFileId}
              files={files}
              onSelect={handleSelect}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
              onContextAction={handleContextAction}
              onRename={handleRenameClick}
              onDelete={handleDeleteClick}
              onNewFile={handleNewFileClick}
              onNewFolder={handleNewFolderClick}
            />
          ))
        )}
      </div>

      <Dialog open={showNewFile} onOpenChange={setShowNewFile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New File</DialogTitle>
            <DialogDescription>Create in {contextParentFolder || "root"}.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>File name</FieldLabel>
              <Input autoFocus placeholder="filename.ext" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateFile()} />
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewFile(false)}>Cancel</Button>
            <Button onClick={handleCreateFile} disabled={!newName.trim()}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>Create in {contextParentFolder || "root"}.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Folder name</FieldLabel>
              <Input autoFocus placeholder="folder name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()} />
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newName.trim()}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRename !== null} onOpenChange={(open) => !open && setShowRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>Enter a new name.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>New name</FieldLabel>
              <Input autoFocus placeholder="New name" value={renamedName} onChange={(e) => setRenamedName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRename()} />
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRename(null)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!renamedName.trim()}>Rename</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete !== null} onOpenChange={(open) => !open && setShowDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {showDelete?.type === "folder" ? "Folder" : "File"}</DialogTitle>
            <DialogDescription>Delete &ldquo;{showDelete?.name}&rdquo;?{showDelete?.type === "folder" && " Contents will also be deleted."}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
