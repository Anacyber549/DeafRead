import {
  ExternalLink,
  Hand,
  MousePointerClick,
  RefreshCw,
  X,
} from 'lucide-react';
import { BgThemeOption } from '../utils/readingSettings';
import { WordHelpResponse } from '../utils/apiClient';
import { buildAslDictionaryUrl } from '../utils/textParser';

export interface WordHelpState {
  selectedWord: string;
  sentence: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: WordHelpResponse;
  errorMessage?: string;
}

interface WordHelpCardProps {
  state: WordHelpState;
  theme: BgThemeOption;
  fontFamily: string;
  onClose: () => void;
  onRetry: () => void;
}

export function WordHelpCard({
  state,
  theme,
  fontFamily,
  onClose,
  onRetry,
}: WordHelpCardProps) {
  const aslWord = state.data?.baseWord || state.selectedWord;
  const aslUrl = buildAslDictionaryUrl(aslWord);

  return (
    <section
      aria-labelledby="word-help-heading"
      aria-live="polite"
      className="rounded-2xl border p-4 sm:p-5 transition-colors duration-200"
      style={{
        backgroundColor: theme.cardBg,
        borderColor:
          state.status === 'idle' ? theme.borderColor : theme.accentColor,
        color: theme.textColor,
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Hand
            className="h-5 w-5 shrink-0"
            style={{ color: theme.accentColor }}
            aria-hidden="true"
          />
          <h2 id="word-help-heading" className="text-lg font-bold">
            Word Help
          </h2>
        </div>

        {state.status !== 'idle' && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close word help"
            className="flex h-11 w-11 items-center justify-center rounded-xl border transition-colors hover:opacity-90"
            style={{
              borderColor: theme.buttonBorder,
              backgroundColor: theme.buttonBg,
              color: theme.textColor,
            }}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {state.status === 'idle' && (
        <div
          className="flex items-center gap-3.5 rounded-xl border p-3.5"
          style={{
            backgroundColor: theme.elevatedBg,
            borderColor: theme.borderColor,
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: theme.isDark ? '#242424' : '#DBEAFE',
              borderColor: theme.isDark ? theme.borderColor : 'transparent',
              color: theme.accentColor,
            }}
            aria-hidden="true"
          >
            <MousePointerClick className="h-6 w-6" />
          </div>
          <p
            className="text-sm font-medium leading-snug sm:text-base"
            style={{ color: theme.mutedTextColor }}
          >
            Click any word in the story to see its simple meaning, a picture
            icon, and its ASL sign.
          </p>
        </div>
      )}

      {state.status !== 'idle' && (
        <div className="space-y-3.5">
          {/* Selected word & Emoji visual */}
          <div
            className="flex items-center gap-4 rounded-xl border p-3.5"
            style={{
              backgroundColor: theme.elevatedBg,
              borderColor: theme.borderColor,
            }}
          >
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border text-4xl"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
              }}
              aria-hidden="true"
            >
              {state.status === 'loading'
                ? '⏳'
                : state.data?.emoji || '📖'}
            </div>
            <div className="min-w-0 flex-1">
              <span
                className="block text-xs font-semibold"
                style={{ color: theme.mutedTextColor }}
              >
                Selected word
              </span>
              <p
                className="truncate text-2xl font-bold"
                style={{ fontFamily }}
              >
                {state.selectedWord}
              </p>
            </div>
          </div>

          {/* Definition body */}
          {state.status === 'loading' && (
            <div
              className="space-y-2 rounded-xl border p-3.5"
              style={{
                backgroundColor: theme.elevatedBg,
                borderColor: theme.borderColor,
              }}
            >
              <div
                className="h-4 w-3/4 animate-pulse rounded"
                style={{
                  backgroundColor: theme.isDark ? '#3F3F46' : '#CBD5E1',
                }}
              />
              <div
                className="h-4 w-1/2 animate-pulse rounded"
                style={{
                  backgroundColor: theme.isDark ? '#3F3F46' : '#CBD5E1',
                }}
              />
              <p
                className="pt-1 text-sm font-medium"
                style={{ color: theme.mutedTextColor }}
              >
                Finding an easy meaning...
              </p>
            </div>
          )}

          {state.status === 'success' && state.data && (
            <div
              className="rounded-xl border p-3.5"
              style={{
                backgroundColor: theme.elevatedBg,
                borderColor: theme.borderColor,
              }}
            >
              <span
                className="mb-1 block text-xs font-semibold"
                style={{ color: theme.mutedTextColor }}
              >
                Easy meaning
              </span>
              <p
                className="text-lg font-medium leading-relaxed"
                style={{ fontFamily }}
              >
                {state.data.definition}
              </p>
            </div>
          )}

          {state.status === 'error' && (
            <div
              className="rounded-xl border p-4"
              style={
                theme.isDark
                  ? {
                      backgroundColor: '#2A1B0A',
                      borderColor: '#F59E0B',
                      color: '#FEF3C7',
                    }
                  : {
                      backgroundColor: '#FFFBEB',
                      borderColor: '#F59E0B',
                      color: '#451A03',
                    }
              }
            >
              <p className="text-sm font-semibold">
                {state.errorMessage || 'Could not load word help.'}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-colors hover:opacity-90"
                style={
                  theme.isDark
                    ? {
                        backgroundColor: '#1A1A1A',
                        borderColor: '#FBBF24',
                        color: '#FFFFFF',
                      }
                    : {
                        backgroundColor: '#78350F',
                        borderColor: '#78350F',
                        color: '#FFFFFF',
                      }
                }
              >
                <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Try again</span>
              </button>
            </div>
          )}

          {/* See ASL sign link button */}
          <a
            href={aslUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border-2 px-5 py-3 text-base font-bold shadow-sm transition-colors hover:opacity-90 whitespace-nowrap"
            style={{
              backgroundColor: theme.primaryBg,
              borderColor: theme.primaryBorder,
              color: theme.primaryText,
            }}
          >
            <Hand
              className="h-5 w-5 shrink-0"
              style={{ color: theme.primaryIconColor }}
              aria-hidden="true"
            />
            <span>See ASL sign</span>
            <ExternalLink
              className="h-4 w-4 shrink-0"
              style={{ color: theme.primaryIconColor }}
              aria-hidden="true"
            />
          </a>
        </div>
      )}
    </section>
  );
}
