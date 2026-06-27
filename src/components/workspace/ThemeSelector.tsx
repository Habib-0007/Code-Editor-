import { Icon } from "@iconify/react";
import { useSettingsStore } from "@/stores/settingsStore";
import { THEME_OPTIONS } from "@/themes/registry";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";

export function ThemeSelector() {
  const { editorTheme, setEditorTheme } = useSettingsStore();

  return (
    <Select value={editorTheme} onValueChange={setEditorTheme}>
      <SelectTrigger className="w-[130px] h-7 text-xs">
        <Icon icon="ph:palette" className="w-3 h-3" />
        <SelectValue placeholder="Editor theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {THEME_OPTIONS.map((opt) => (
            <SelectItem key={opt.key} value={opt.key}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
