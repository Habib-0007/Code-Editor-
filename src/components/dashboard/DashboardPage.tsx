import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useProjectStore } from "@/stores/projectStore";
import { createProject, deleteProject, duplicateProject, exportProjectAsJson, importProjectFromJson } from "@/db";
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

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { projects, loading, loadProjects } = useProjectStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = useCallback(async () => {
    if (!projectName.trim()) return;
    const project = await createProject(projectName.trim());
    setShowCreate(false);
    setProjectName("");
    navigate(`/project/${project.id}`);
  }, [projectName, navigate]);

  const handleDelete = useCallback(async () => {
    if (!showDelete) return;
    await deleteProject(showDelete);
    setShowDelete(null);
    loadProjects();
  }, [showDelete, loadProjects]);

  const handleDuplicate = useCallback(
    async (id: string) => {
      await duplicateProject(id);
      loadProjects();
    },
    [loadProjects],
  );

  const handleExport = useCallback(
    async (id: string) => {
      const json = await exportProjectAsJson(id);
      if (!json) return;
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `writecode-${id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [],
  );

  const handleImport = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      await importProjectFromJson(text);
      loadProjects();
    };
    input.click();
  }, [loadProjects]);

  const openProject = useCallback(
    (id: string) => navigate(`/project/${id}`),
    [navigate],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground animate-fade-in">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 shrink-0 sm:px-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background shrink-0">
            <Icon icon="ph:code-block" className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            WriteCode
          </h1>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="gap-1 h-8 w-8 p-0 sm:px-2">
            <Icon icon="ph:gear" className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleImport} className="gap-1 h-8 px-2 sm:px-3">
            <Icon icon="ph:upload-simple" className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1 h-8 px-2 sm:px-3">
            <Icon icon="ph:plus" className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center py-20 px-6">
            <div className="rounded-2xl border border-border/60 bg-surface p-5">
              <Icon icon="ph:code-block" className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">No projects yet</h2>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                Create your first project to start coding.
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-1.5 mt-1">
              <Icon icon="ph:plus" className="w-3.5 h-3.5" />
              Create project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
              <ContextMenu key={project.id}>
                <ContextMenuTrigger>
                  <div
                    className="group flex flex-col gap-3 rounded-xl border border-border/70 bg-surface-elevated p-4 cursor-pointer transition-all duration-150 hover:border-border hover:bg-surface-hover active:scale-[0.98] sm:p-5"
                    onClick={() => openProject(project.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-foreground shrink-0 border border-border/60">
                        <Icon icon="ph:pencil-line" className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-semibold text-foreground truncate">
                        {project.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground/60 pl-[42px]">
                      <span className="flex items-center gap-1">
                        <Icon icon="ph:file" className="w-2.5 h-2.5" />
                        {project.fileCount}
                      </span>
                      <span>{formatTime(project.updatedAt)}</span>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => openProject(project.id)}>
                    <Icon icon="ph:code-block" className="w-3 h-3" /> Open
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleDuplicate(project.id)}>
                    <Icon icon="ph:copy" className="w-3 h-3" /> Duplicate
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleExport(project.id)}>
                    <Icon icon="ph:download-simple" className="w-3 h-3" /> Export
                  </ContextMenuItem>
                  <ContextMenuItem
                    variant="destructive"
                    onClick={() => setShowDelete(project.id)}
                  >
                    <Icon icon="ph:trash" className="w-3 h-3" /> Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>Give your project a name.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Project name</FieldLabel>
              <Input
                autoFocus
                placeholder="My Project"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </Field>
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!projectName.trim()}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete !== null} onOpenChange={(open) => !open && setShowDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              This will permanently delete the project and all its files.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
