import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Settings, Type, Palette, Minus, Plus } from "lucide-react";

export type ReadingTheme = "light" | "sepia" | "dark";

export type ReadingSettings = {
  fontSize: number;
  theme: ReadingTheme;
  lineHeight: number;
  fontFamily: "serif" | "sans" | "mono";
};

const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 18,
  theme: "light",
  lineHeight: 1.8,
  fontFamily: "serif",
};

const THEME_LABELS: Record<ReadingTheme, string> = {
  light: "Light",
  sepia: "Sepia",
  dark: "Dark",
};

interface ReadingSettingsProps {
  settings: ReadingSettings;
  onSettingsChange: (settings: ReadingSettings) => void;
}

export function ReadingSettingsPanel({ settings, onSettingsChange }: ReadingSettingsProps) {
  const [localSettings, setLocalSettings] = useState<ReadingSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const updateSetting = <K extends keyof ReadingSettings>(key: K, value: ReadingSettings[K]) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Font Size */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Type className="h-4 w-4" />
          Font Size
        </Label>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateSetting("fontSize", Math.max(12, localSettings.fontSize - 2))}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-medium w-12 text-center">{localSettings.fontSize}px</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateSetting("fontSize", Math.min(32, localSettings.fontSize + 2))}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Line Height */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Line Height</Label>
        <Slider
          value={[localSettings.lineHeight]}
          onValueChange={([value]) => updateSetting("lineHeight", value)}
          min={1.2}
          max={2.5}
          step={0.1}
          className="w-full"
        />
        <div className="text-xs text-muted-foreground text-center">{localSettings.lineHeight.toFixed(1)}</div>
      </div>

      {/* Font Family */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Font Family</Label>
        <div className="grid grid-cols-3 gap-2">
          {(["serif", "sans", "mono"] as const).map((font) => (
            <Button
              key={font}
              variant={localSettings.fontFamily === font ? "default" : "outline"}
              size="sm"
              onClick={() => updateSetting("fontFamily", font)}
              className="capitalize"
            >
              {font}
            </Button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(THEME_LABELS) as ReadingTheme[]).map((theme) => (
            <Button
              key={theme}
              variant={localSettings.theme === theme ? "default" : "outline"}
              size="sm"
              onClick={() => updateSetting("theme", theme)}
            >
              {THEME_LABELS[theme]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function useReadingSettings() {
  const [settings, setSettings] = useState<ReadingSettings>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("reading-settings");
      if (stored) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch {
          return DEFAULT_SETTINGS;
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = (newSettings: ReadingSettings) => {
    setSettings(newSettings);
    localStorage.setItem("reading-settings", JSON.stringify(newSettings));
  };

  return { settings, updateSettings };
}

export function getReaderThemeStyles(theme: ReadingTheme): string {
  switch (theme) {
    case "light":
      return "bg-white text-gray-900";
    case "sepia":
      return "bg-[#f4ecd8] text-[#5b4636]";
    case "dark":
      return "bg-gray-900 text-gray-100";
    default:
      return "bg-white text-gray-900";
  }
}

export function getReaderFontFamily(fontFamily: ReadingSettings["fontFamily"]): string {
  switch (fontFamily) {
    case "serif":
      return "Georgia, 'Times New Roman', serif";
    case "sans":
      return "system-ui, -apple-system, sans-serif";
    case "mono":
      return "'Courier New', monospace";
    default:
      return "Georgia, 'Times New Roman', serif";
  }
}