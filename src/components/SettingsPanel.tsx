import {
  Camera,
  Check,
  Minus,
  Plus,
  RotateCcw,
  Type as TypeIcon,
  Palette,
  MoveVertical,
  MoveHorizontal,
} from 'lucide-react';
import {
  BG_THEMES,
  BgThemeId,
  BgThemeOption,
  DEFAULT_READING_SETTINGS,
  FONT_OPTIONS,
  FontChoice,
  ReadingSettings,
  SETTING_LIMITS,
  clampSettingValue,
} from '../utils/readingSettings';

interface SettingsPanelProps {
  settings: ReadingSettings;
  theme: BgThemeOption;
  eyeHelpEnabled: boolean;
  onToggleEyeHelp: () => void;
  onChange: (next: ReadingSettings) => void;
}

export function SettingsPanel({
  settings,
  theme,
  eyeHelpEnabled,
  onToggleEyeHelp,
  onChange,
}: SettingsPanelProps) {
  const updateField = <K extends keyof ReadingSettings>(
    key: K,
    value: ReadingSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const stepFontSize = (delta: number) => {
    const nextSize = clampSettingValue(
      settings.fontSize + delta,
      SETTING_LIMITS.fontSize.min,
      SETTING_LIMITS.fontSize.max
    );
    updateField('fontSize', nextSize);
  };

  return (
    <section
      aria-labelledby="settings-heading"
      className="rounded-2xl border p-4 transition-colors duration-200"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
        color: theme.textColor,
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TypeIcon
            className="h-5 w-5 shrink-0"
            style={{ color: theme.accentColor }}
            aria-hidden="true"
          />
          <h2 id="settings-heading" className="text-lg font-bold">
            Reading Settings
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onChange(DEFAULT_READING_SETTINGS)}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors hover:opacity-90"
          style={{
            borderColor: theme.buttonBorder,
            backgroundColor: theme.buttonBg,
            color: theme.textColor,
          }}
        >
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-3.5">
        {/* Font Choice */}
        <div>
          <span className="mb-2 block text-sm font-bold">Font style</span>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Font style">
            {FONT_OPTIONS.map((option) => {
              const isSelected = settings.font === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateField('font', option.id as FontChoice)}
                  aria-pressed={isSelected}
                  className="flex min-h-[56px] flex-col items-center justify-center rounded-xl border-2 px-2 py-1.5 text-center transition-colors hover:opacity-90"
                  style={
                    isSelected
                      ? {
                          borderColor: theme.selectedBorder,
                          backgroundColor: theme.selectedBg,
                          color: theme.selectedText,
                        }
                      : {
                          borderColor: theme.buttonBorder,
                          backgroundColor: theme.buttonBg,
                          color: theme.textColor,
                        }
                  }
                >
                  <span
                    className="text-lg font-bold leading-none"
                    style={{ fontFamily: option.fontFamily }}
                  >
                    Aa
                  </span>
                  <span className="mt-1 text-xs font-semibold leading-tight">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Size Slider */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor="font-size-slider"
              className="flex items-center gap-2 text-sm font-bold"
            >
              <TypeIcon
                className="h-4 w-4 shrink-0"
                style={{ color: theme.accentColor }}
                aria-hidden="true"
              />
              <span>Text size</span>
            </label>
            <span className="text-sm font-bold tabular-nums">
              {settings.fontSize}px
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => stepFontSize(-2)}
              aria-label="Decrease text size"
              disabled={settings.fontSize <= SETTING_LIMITS.fontSize.min}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-bold transition-colors hover:opacity-90 disabled:opacity-40"
              style={{
                borderColor: theme.buttonBorder,
                backgroundColor: theme.buttonBg,
                color: theme.textColor,
              }}
            >
              <Minus className="h-5 w-5" aria-hidden="true" />
            </button>
            <input
              id="font-size-slider"
              type="range"
              min={SETTING_LIMITS.fontSize.min}
              max={SETTING_LIMITS.fontSize.max}
              step={SETTING_LIMITS.fontSize.step}
              value={settings.fontSize}
              onChange={(e) => updateField('fontSize', Number(e.target.value))}
              className="signread-slider w-full"
            />
            <button
              type="button"
              onClick={() => stepFontSize(2)}
              aria-label="Increase text size"
              disabled={settings.fontSize >= SETTING_LIMITS.fontSize.max}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-bold transition-colors hover:opacity-90 disabled:opacity-40"
              style={{
                borderColor: theme.buttonBorder,
                backgroundColor: theme.buttonBg,
                color: theme.textColor,
              }}
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Line Spacing Slider */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor="line-spacing-slider"
              className="flex items-center gap-2 text-sm font-bold"
            >
              <MoveVertical
                className="h-4 w-4 shrink-0"
                style={{ color: theme.accentColor }}
                aria-hidden="true"
              />
              <span>Line spacing</span>
            </label>
            <span className="text-sm font-bold tabular-nums">
              {settings.lineSpacing.toFixed(1)}×
            </span>
          </div>
          <input
            id="line-spacing-slider"
            type="range"
            min={SETTING_LIMITS.lineSpacing.min}
            max={SETTING_LIMITS.lineSpacing.max}
            step={SETTING_LIMITS.lineSpacing.step}
            value={settings.lineSpacing}
            onChange={(e) => updateField('lineSpacing', Number(e.target.value))}
            className="signread-slider w-full"
          />
        </div>

        {/* Letter Spacing Slider */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor="letter-spacing-slider"
              className="flex items-center gap-2 text-sm font-bold"
            >
              <MoveHorizontal
                className="h-4 w-4 shrink-0"
                style={{ color: theme.accentColor }}
                aria-hidden="true"
              />
              <span>Letter spacing</span>
            </label>
            <span className="text-sm font-bold tabular-nums">
              {settings.letterSpacing.toFixed(2)}em
            </span>
          </div>
          <input
            id="letter-spacing-slider"
            type="range"
            min={SETTING_LIMITS.letterSpacing.min}
            max={SETTING_LIMITS.letterSpacing.max}
            step={SETTING_LIMITS.letterSpacing.step}
            value={settings.letterSpacing}
            onChange={(e) =>
              updateField('letterSpacing', Number(e.target.value))
            }
            className="signread-slider w-full"
          />
        </div>

        {/* Background Color Swatches */}
        <div>
          <span className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Palette
              className="h-4 w-4 shrink-0"
              style={{ color: theme.accentColor }}
              aria-hidden="true"
            />
            <span>Page color</span>
          </span>
          <div
            className="grid grid-cols-2 gap-2"
            role="group"
            aria-label="Page background color"
          >
            {(Object.values(BG_THEMES) as BgThemeOption[]).map((bgOption) => {
              const isSelected = settings.bgTheme === bgOption.id;
              return (
                <button
                  key={bgOption.id}
                  type="button"
                  onClick={() => updateField('bgTheme', bgOption.id as BgThemeId)}
                  aria-pressed={isSelected}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-2.5 py-1.5 text-left text-sm font-semibold transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: bgOption.swatchColor,
                    color: bgOption.textColor,
                    borderColor: isSelected
                      ? theme.accentColor
                      : bgOption.buttonBorder,
                  }}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2"
                    style={{
                      backgroundColor: bgOption.swatchColor,
                      borderColor: isSelected
                        ? theme.accentColor
                        : bgOption.buttonBorder,
                    }}
                    aria-hidden="true"
                  >
                    {isSelected ? (
                      <Check
                        className="h-3.5 w-3.5 stroke-[3]"
                        style={{ color: bgOption.accentColor }}
                      />
                    ) : null}
                  </span>
                  <span className="whitespace-nowrap">{bgOption.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Eye Help Toggle */}
        <div
          className="border-t pt-3.5"
          style={{ borderColor: theme.borderColor }}
        >
          <button
            type="button"
            role="switch"
            aria-checked={eyeHelpEnabled}
            onClick={onToggleEyeHelp}
            className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left transition-colors hover:opacity-90"
            style={
              eyeHelpEnabled
                ? {
                    backgroundColor: theme.selectedBg,
                    borderColor: theme.selectedBorder,
                    color: theme.selectedText,
                  }
                : {
                    backgroundColor: theme.buttonBg,
                    borderColor: theme.buttonBorder,
                    color: theme.textColor,
                  }
            }
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Camera
                className="h-5 w-5 shrink-0"
                style={{ color: theme.accentColor }}
                aria-hidden="true"
              />
              <span className="text-sm font-bold leading-tight">
                Eye help (uses camera)
              </span>
            </span>
            <span
              className="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold uppercase"
              style={
                eyeHelpEnabled
                  ? {
                      backgroundColor: theme.primaryBg,
                      borderColor: theme.primaryBorder,
                      color: theme.primaryText,
                    }
                  : {
                      backgroundColor: theme.elevatedBg,
                      borderColor: theme.borderColor,
                      color: theme.mutedTextColor,
                    }
              }
            >
              {eyeHelpEnabled ? 'On' : 'Off'}
            </span>
          </button>
          <p
            className="mt-1.5 text-xs font-medium leading-snug"
            style={{ color: theme.mutedTextColor }}
          >
            Stays in your browser. Camera data is never saved or sent anywhere.
          </p>
        </div>
      </div>
    </section>
  );
}
