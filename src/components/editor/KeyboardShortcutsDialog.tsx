import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@iconify/react";

interface Shortcut {
  keys: string[];
  label: string;
}

interface ShortcutGroup {
  group: string;
  shortcuts: Shortcut[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    group: "Editing",
    shortcuts: [
      { keys: ["Tab"], label: "Indent" },
      { keys: ["Shift", "Tab"], label: "Outdent" },
      { keys: ["Ctrl", "Z"], label: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], label: "Redo" },
      { keys: ["Ctrl", "/"], label: "Toggle comment" },
      { keys: ["Ctrl", "D"], label: "Delete line" },
    ],
  },
  {
    group: "Navigation & Selection",
    shortcuts: [
      { keys: ["Ctrl", "F"], label: "Find" },
      { keys: ["Ctrl", "H"], label: "Find and replace" },
      { keys: ["Ctrl", "G"], label: "Go to line" },
      { keys: ["Ctrl", "A"], label: "Select all" },
      { keys: ["Alt", "↑"], label: "Move line up" },
      { keys: ["Alt", "↓"], label: "Move line down" },
    ],
  },
  {
    group: "File",
    shortcuts: [
      { keys: ["Ctrl", "S"], label: "Save file" },
      { keys: ["Ctrl", "W"], label: "Close tab" },
    ],
  },
];

function ShortcutKey({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded border border-border bg-surface px-1.5 text-[10px] font-medium leading-snug h-5 min-w-[20px]">
      {children}
    </kbd>
  );
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Icon icon="ph:keyboard" className="w-4 h-4 text-muted-foreground" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.group}>
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50 mb-2">
                {group.group}
              </h4>
              <div className="flex flex-col gap-1">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="flex items-center justify-between py-1 px-1 rounded-sm hover:bg-surface-hover/50"
                  >
                    <span className="text-sm text-foreground">{shortcut.label}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <ShortcutKey>{key}</ShortcutKey>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-[8px] text-muted-foreground/40">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
