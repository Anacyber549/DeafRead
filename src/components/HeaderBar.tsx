import { BookOpen, Camera, SlidersHorizontal, Square } from 'lucide-react';
import { BgThemeOption } from '../utils/readingSettings';

interface HeaderBarProps {
  theme: BgThemeOption;
  showSettings: boolean;
  onToggleSettings: () => void;
  eyeTrackingActive: boolean;
  onStopEyeTracking: () => void;
}

export function HeaderBar({
  theme,
  showSettings,
  onToggleSettings,
  eyeTrackingActive,
  onStopEyeTracking,
}: HeaderBarProps) {
  return (
    <header
      className="border-b transition-colors duration-200"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
        color: theme.textColor,
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Zone 1: Brand mark */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2"
            style={{
              backgroundColor: theme.primaryBg,
              borderColor: theme.primaryBorder,
              color: theme.primaryIconColor,
            }}
            aria-hidden="true"
          >
            <BookOpen className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight whitespace-nowrap shrink-0">
            DeafRead
          </span>
        </div>

        {/* Zone 2: Camera indicator + Settings toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {eyeTrackingActive && (
            <div
              className="flex items-center gap-2.5 rounded-xl border-2 px-3 py-1.5"
              style={{
                backgroundColor: theme.elevatedBg,
                borderColor: theme.accentColor,
                color: theme.textColor,
              }}
              data-testid="camera-active-bar"
            >
              <Camera
                className="h-5 w-5 shrink-0"
                style={{ color: theme.accentColor }}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold whitespace-nowrap">
                Eye help on
              </span>
              <button
                type="button"
                onClick={onStopEyeTracking}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold whitespace-nowrap transition-colors hover:opacity-90"
                style={{
                  backgroundColor: theme.buttonBg,
                  borderColor: theme.buttonBorder,
                  color: theme.textColor,
                }}
              >
                <Square className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Stop tracking</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleSettings}
            aria-expanded={showSettings}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold whitespace-nowrap shrink-0 transition-colors hover:opacity-90"
            style={
              showSettings
                ? {
                    backgroundColor: theme.primaryBg,
                    borderColor: theme.primaryBorder,
                    color: theme.primaryText,
                  }
                : {
                    backgroundColor: theme.buttonBg,
                    borderColor: theme.buttonBorder,
                    color: theme.textColor,
                  }
            }
          >
            <SlidersHorizontal
              className="h-5 w-5 shrink-0"
              style={
                showSettings
                  ? { color: theme.primaryIconColor }
                  : { color: theme.accentColor }
              }
              aria-hidden="true"
            />
            <span>{showSettings ? 'Hide Settings' : 'Text Settings'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
