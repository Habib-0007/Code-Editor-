import { Icon } from "@iconify/react";

const keyBtn = "inline-flex items-center justify-center rounded-md border border-border/50 bg-surface-elevated text-[12px] font-semibold leading-none text-center text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.04)] active:bg-surface-hover active:scale-95 transition-all duration-75 select-none cursor-pointer";
const actBtn = "inline-flex items-center justify-center rounded-md border border-border/40 bg-surface text-[11px] font-semibold leading-none text-center text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.04)] hover:bg-surface-hover active:scale-95 transition-all duration-75 select-none cursor-pointer";
const keyLabel = "inline-flex items-center justify-center rounded-md border border-border/30 bg-surface/50 text-[12px] font-semibold leading-none text-center text-muted-foreground/60 select-none";

function K({ label, onClick }: { label: string; onClick?: () => void }) {
  return <button onClick={onClick} className={`${keyBtn} min-w-[30px] h-8 px-2.5`}>{label}</button>;
}

function A({ label, icon, onClick }: { label: string; icon?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`${actBtn} h-8 px-3 gap-1.5`}>
      {icon && <Icon icon={icon} className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

function L({ label }: { label: string }) {
  return <span className={`${keyLabel} h-8 min-w-[30px] px-2.5`}>{label}</span>;
}

const sep = <span className="w-px h-5 bg-border/20 mx-1.5 shrink-0" />;

interface Props {
  onInsertText: (text: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onShortcutsOpen: () => void;
}

export function KeyboardToolbar({ onInsertText, onUndo, onRedo, onShortcutsOpen }: Props) {
  return (
    <div className="shrink-0 border-t border-border bg-surface animate-fade-in">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 overflow-x-auto scrollbar-none">
        <L label="Ctrl" />
        <L label="Alt" />
        <L label="Shift" />
        {sep}
        <K label="↑" onClick={() => onInsertText("↑")} />
        <K label="↓" onClick={() => onInsertText("↓")} />
        {sep}
        <K label="Tab" onClick={() => onInsertText("\t")} />
        <K label="Spc" onClick={() => onInsertText(" ")} />
        <K label="↵" onClick={() => onInsertText("\n")} />
        {sep}
        <K label="(" onClick={() => onInsertText("(")} />
        <K label=")" onClick={() => onInsertText(")")} />
        <K label="{" onClick={() => onInsertText("{")} />
        <K label="}" onClick={() => onInsertText("}")} />
        <K label="[" onClick={() => onInsertText("[")} />
        <K label="]" onClick={() => onInsertText("]")} />
        <K label="<" onClick={() => onInsertText("<")} />
        <K label=">" onClick={() => onInsertText(">")} />
        {sep}
        <K label="," onClick={() => onInsertText(",")} />
        <K label="." onClick={() => onInsertText(".")} />
        <K label=";" onClick={() => onInsertText(";")} />
        <K label=":" onClick={() => onInsertText(":")} />
        <K label="'" onClick={() => onInsertText("'")} />
        <K label={'"'} onClick={() => onInsertText('"')} />
        <K label="`" onClick={() => onInsertText("`")} />
        <K label="~" onClick={() => onInsertText("~")} />
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-t border-border/20 overflow-x-auto scrollbar-none">
        <A label="Undo" icon="ph:arrow-counter-clockwise" onClick={onUndo} />
        <A label="Redo" icon="ph:arrow-clockwise" onClick={onRedo} />
        {sep}
        <K label="=" onClick={() => onInsertText("=")} />
        <K label="+" onClick={() => onInsertText("+")} />
        <K label="-" onClick={() => onInsertText("-")} />
        <K label="*" onClick={() => onInsertText("*")} />
        <K label="/" onClick={() => onInsertText("/")} />
        <K label="\" onClick={() => onInsertText("\\")} />
        <K label="!" onClick={() => onInsertText("!")} />
        <K label="?" onClick={() => onInsertText("?")} />
        <K label="^" onClick={() => onInsertText("^")} />
        <K label="|" onClick={() => onInsertText("|")} />
        {sep}
        <K label="#" onClick={() => onInsertText("#")} />
        <K label="@" onClick={() => onInsertText("@")} />
        <K label="$" onClick={() => onInsertText("$")} />
        <K label="%" onClick={() => onInsertText("%")} />
        <K label="&" onClick={() => onInsertText("&")} />
        <K label="_" onClick={() => onInsertText("_")} />
        {sep}
        <A label="Spc×4" onClick={() => onInsertText("    ")} />
        <button onClick={onShortcutsOpen} className={`${actBtn} h-8 w-8 items-center justify-center p-0`}>
          <Icon icon="ph:keyboard" className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
