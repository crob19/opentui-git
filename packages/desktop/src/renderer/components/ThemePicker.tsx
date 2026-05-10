import { Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ACTIVE_THEME_KEY,
  THEMES,
  setActiveTheme,
  type ThemeKey,
} from "../lib/theme.js";

export function ThemePicker() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="sb-btn"
          title={`Theme: ${THEMES[ACTIVE_THEME_KEY].name}`}
        >
          <Palette />
          <span>{THEMES[ACTIVE_THEME_KEY].name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuRadioGroup
          value={ACTIVE_THEME_KEY}
          onValueChange={(v) => setActiveTheme(v as ThemeKey)}
        >
          {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
            <DropdownMenuRadioItem key={key} value={key}>
              {THEMES[key].name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
