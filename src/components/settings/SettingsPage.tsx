import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useSettingsStore } from "@/stores/settingsStore";
import { THEME_OPTIONS } from "@/themes/registry";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const FONT_OPTIONS = [
  { value: "JetBrains Mono", label: "JetBrains Mono" },
  { value: "Fira Code", label: "Fira Code" },
  { value: "Source Code Pro", label: "Source Code Pro" },
  { value: "Cousine", label: "Cousine" },
  { value: "Ubuntu Mono", label: "Ubuntu Mono" },
  { value: "Menlo", label: "Menlo" },
  { value: "Monaco", label: "Monaco" },
];

const TAB_SIZE_OPTIONS = [
  { value: 2, label: "2 spaces" },
  { value: 4, label: "4 spaces" },
  { value: 8, label: "8 spaces" },
];

const CURSOR_STYLE_OPTIONS = [
  { value: "line", label: "Line" },
  { value: "block", label: "Block" },
  { value: "underline", label: "Underline" },
];

const CURSOR_BLINK_OPTIONS = [
  { value: "blink", label: "Blink" },
  { value: "smooth", label: "Smooth" },
  { value: "phase", label: "Phase" },
  { value: "solid", label: "Solid (off)" },
];

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
        {title}
      </h2>
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-surface-elevated p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5 min-w-0 shrink-0">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground truncate">{description}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`
        relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 cursor-pointer
        ${checked ? "bg-foreground" : "bg-border"}
      `}
    >
      <span
        className={`
          absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background shadow-sm
          transition-transform duration-150
          ${checked ? "translate-x-4" : "translate-x-0"}
        `}
      />
    </button>
  );
}

function RangeSlider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="
          w-24 sm:w-32 h-1.5 appearance-none cursor-pointer
          rounded-full bg-border
          accent-foreground
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-foreground
          [&::-webkit-slider-thumb]:shadow-sm
          [&::-webkit-slider-thumb]:cursor-pointer
        "
      />
      <span className="min-w-[28px] text-right text-sm font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

function SegmentedControl({
  value,
  options,
  iconMap,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  iconMap?: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium
            transition-colors duration-100 cursor-pointer
            ${value === opt.value
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
            }
          `}
        >
          {iconMap?.[opt.value] && <Icon icon={iconMap[opt.value]} className="w-3.5 h-3.5" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const s = useSettingsStore();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 shrink-0 sm:px-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="h-7 w-7 p-0 shrink-0"
          >
            <Icon icon="ph:arrow-left" className="w-4 h-4" />
          </Button>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background shrink-0">
            <Icon icon="ph:gear" className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            Settings
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-lg flex flex-col gap-6">

          {/* ── Appearance ── */}
          <SettingsSection title="Appearance">
            <SettingRow label="App Theme" description="Switch between light and dark mode">
              <SegmentedControl
                value={s.uiTheme}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
                iconMap={{ light: "ph:sun", dark: "ph:moon" }}
                onChange={(v) => s.setUiTheme(v as any)}
              />
            </SettingRow>
          </SettingsSection>

          {/* ── Editor Theme ── */}
          <SettingsSection title="Editor Theme">
            <SettingRow label="Color Scheme" description="CodeMirror editor color theme">
              <Select value={s.editorTheme} onValueChange={(v) => s.setEditorTheme(v)}>
                <SelectTrigger className="w-[140px] sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
          </SettingsSection>

          {/* ── Typography ── */}
          <SettingsSection title="Typography">
            <SettingRow label="Font Family" description="Monospace font for the editor">
              <Select value={s.fontFamily} onValueChange={(v) => s.setFontFamily(v)}>
                <SelectTrigger className="w-[140px] sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Font Size" description="Editor text size in pixels">
              <RangeSlider value={s.fontSize} min={10} max={24} step={1} onChange={s.setFontSize} />
            </SettingRow>
          </SettingsSection>

          {/* ── Editing ── */}
          <SettingsSection title="Editing">
            <SettingRow label="Tab Size" description="Spaces per indentation level">
              <Select
                value={String(s.tabSize)}
                onValueChange={(v) => s.setTabSize(Number(v))}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAB_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Line Wrapping" description="Wrap long lines to fit viewport">
              <ToggleSwitch checked={s.lineWrapping} onChange={s.setLineWrapping} />
            </SettingRow>
            <SettingRow label="Indent Guides" description="Show vertical indentation guides">
              <ToggleSwitch checked={s.indentGuides} onChange={s.setIndentGuides} />
            </SettingRow>
            <SettingRow label="Auto Save" description="Automatically save on edit">
              <ToggleSwitch checked={s.autoSave} onChange={s.setAutoSave} />
            </SettingRow>
          </SettingsSection>

          {/* ── Cursor ── */}
          <SettingsSection title="Cursor">
            <SettingRow label="Cursor Style" description="Shape of the editing cursor">
              <Select
                value={s.cursorStyle}
                onValueChange={(v) => s.setCursorStyle(v as any)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURSOR_STYLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Cursor Blinking" description="Cursor animation style">
              <Select
                value={s.cursorBlinking}
                onValueChange={(v) => s.setCursorBlinking(v as any)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURSOR_BLINK_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
          </SettingsSection>

          {/* ── Display ── */}
          <SettingsSection title="Display">
            <SettingRow label="Line Numbers" description="Show line numbers in the gutter">
              <ToggleSwitch checked={s.showLineNumbers} onChange={s.setShowLineNumbers} />
            </SettingRow>
            <SettingRow label="Highlight Active Line" description="Highlight the current line">
              <ToggleSwitch checked={s.highlightActiveLine} onChange={s.setHighlightActiveLine} />
            </SettingRow>
            <SettingRow label="Bracket Matching" description="Highlight matching brackets">
              <ToggleSwitch checked={s.bracketMatching} onChange={s.setBracketMatching} />
            </SettingRow>
            <SettingRow label="Code Folding" description="Collapse code sections">
              <ToggleSwitch checked={s.codeFolding} onChange={s.setCodeFolding} />
            </SettingRow>
          </SettingsSection>

          {/* ── About ── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
              About
            </h2>
            <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-surface-elevated p-4 sm:p-5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>WriteCode</span>
                <span className="font-medium text-foreground">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Engine</span>
                <span className="font-medium text-foreground">CodeMirror 6</span>
              </div>
              <div className="flex items-center justify-between">
                <span>UI Framework</span>
                <span className="font-medium text-foreground">React + Tailwind v4</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
