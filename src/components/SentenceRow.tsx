import {
  ExternalLink,
  Hand,
  HelpCircle,
  Image as ImageIcon,
  Lightbulb,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { SentenceHintType } from '../utils/eyeTracking';
import { BgThemeOption } from '../utils/readingSettings';
import {
  buildAslDictionaryUrl,
  pickKeyWordFromSentence,
  tokenizeSentence,
} from '../utils/textParser';

export interface SentenceSimplificationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  isOpen: boolean;
  simplified?: string;
  errorMessage?: string;
}

export interface SentenceVisualState {
  status: 'idle' | 'loading' | 'success' | 'error';
  isOpen: boolean;
  emojis?: string[];
  caption?: string;
  errorMessage?: string;
}

interface SentenceRowProps {
  sentenceIndex: number;
  sentence: string;
  selectedWord: string | null;
  selectedSentenceIndex: number | null;
  theme: BgThemeOption;
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  letterSpacing: number;
  simplification: SentenceSimplificationState;
  visual?: SentenceVisualState;
  isFocusMode?: boolean;
  readingGuideActive?: boolean;
  isGazeTarget?: boolean;
  eyeHint?: SentenceHintType | null;
  onWordClick: (word: string, sentence: string, sentenceIndex: number) => void;
  onSimplifyClick: (sentenceIndex: number, sentence: string) => void;
  onPictureClick?: (sentenceIndex: number, sentence: string) => void;
  onAslChoiceClick?: (
    word: string,
    sentence: string,
    sentenceIndex: number
  ) => void;
  onDismissEyeHint?: (sentenceIndex: number) => void;
}

export function SentenceRow({
  sentenceIndex,
  sentence,
  selectedWord,
  selectedSentenceIndex,
  theme,
  fontFamily,
  fontSize,
  lineSpacing,
  letterSpacing,
  simplification,
  visual,
  isFocusMode = false,
  readingGuideActive = false,
  isGazeTarget = false,
  eyeHint = null,
  onWordClick,
  onSimplifyClick,
  onPictureClick,
  onAslChoiceClick,
  onDismissEyeHint,
}: SentenceRowProps) {
  const tokens = tokenizeSentence(sentence);
  const keyWord = pickKeyWordFromSentence(sentence);
  const aslUrl = buildAslDictionaryUrl(keyWord);
  const isDwellHighlighted = eyeHint === 'dwell';

  const cardOpacity =
    readingGuideActive && !isFocusMode
      ? isGazeTarget
        ? 'opacity-100'
        : 'opacity-55'
      : 'opacity-100';

  const cardBorderColor =
    readingGuideActive && isGazeTarget
      ? theme.accentColor
      : theme.borderColor;

  return (
    <div
      className={`rounded-2xl border-2 p-4 sm:p-5 transition-all duration-300 ${cardOpacity}`}
      style={{
        backgroundColor: isFocusMode ? theme.cardBg : theme.elevatedBg,
        borderColor: cardBorderColor,
      }}
      data-testid={`sentence-row-${sentenceIndex}`}
      data-sentence-index={sentenceIndex}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Original sentence — always visible above any simplified version */}
        <p
          className="flex-1 break-words"
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            lineHeight: lineSpacing,
            letterSpacing: `${letterSpacing}em`,
            color: theme.textColor,
          }}
        >
          {tokens.map((token, idx) => {
            if (!token.isWord) {
              return <span key={idx}>{token.text}</span>;
            }

            const isWordSelected =
              selectedSentenceIndex === sentenceIndex &&
              selectedWord?.toLowerCase() === token.cleanWord.toLowerCase();

            return (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  onWordClick(token.cleanWord, sentence, sentenceIndex)
                }
                aria-label={`Get help for word ${token.cleanWord}`}
                aria-pressed={isWordSelected}
                className="inline cursor-pointer rounded-md px-0.5 py-0.5 text-left transition-colors hover:underline hover:decoration-current hover:decoration-2 hover:underline-offset-4"
                style={{
                  backgroundColor: isWordSelected
                    ? theme.activeWordBg
                    : 'transparent',
                  boxShadow: isWordSelected
                    ? `inset 0 0 0 2px ${theme.activeWordBorder}`
                    : undefined,
                  color: theme.textColor,
                }}
              >
                {token.text}
              </button>
            );
          })}
        </p>

        {/* "I don't understand" button next to each sentence */}
        <div className="flex flex-col items-start gap-2 shrink-0 sm:items-end sm:pt-1">
          <button
            type="button"
            onClick={() => onSimplifyClick(sentenceIndex, sentence)}
            aria-expanded={simplification.isOpen}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold whitespace-nowrap transition-all duration-300 hover:opacity-90"
            style={
              simplification.isOpen
                ? {
                    borderColor: theme.primaryBorder,
                    backgroundColor: theme.primaryBg,
                    color: theme.primaryText,
                  }
                : isDwellHighlighted
                  ? {
                      borderColor: theme.accentColor,
                      backgroundColor: theme.selectedBg,
                      color: theme.selectedText,
                      boxShadow: `0 0 0 3px ${theme.accentColor}40`,
                    }
                  : {
                      borderColor: theme.buttonBorder,
                      backgroundColor: theme.buttonBg,
                      color: theme.textColor,
                    }
            }
          >
            <HelpCircle
              className="h-5 w-5 shrink-0"
              style={
                simplification.isOpen
                  ? { color: theme.primaryIconColor }
                  : { color: theme.accentColor }
              }
              aria-hidden="true"
            />
            <span>I don't understand</span>
          </button>

          {/* Soft visual dwell message (> 8 seconds) */}
          {isDwellHighlighted && !simplification.isOpen && (
            <div
              className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-opacity duration-300"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.accentColor,
                color: theme.textColor,
              }}
              role="status"
              data-testid={`dwell-hint-${sentenceIndex}`}
            >
              <span>Need help with this sentence?</span>
              {onDismissEyeHint && (
                <button
                  type="button"
                  onClick={() => onDismissEyeHint(sentenceIndex)}
                  aria-label="Dismiss sentence help message"
                  className="flex h-6 w-6 items-center justify-center rounded-md hover:opacity-80"
                  style={{ color: theme.mutedTextColor }}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Soft 3-choice help bubble when returning to the same sentence 3+ times */}
      {eyeHint === 'returns' && (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 p-3.5 transition-opacity duration-300"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.accentColor,
            color: theme.textColor,
          }}
          role="region"
          aria-label="Sentence help choices"
          data-testid={`returns-bubble-${sentenceIndex}`}
        >
          <div className="flex items-center gap-2 text-sm font-bold">
            <Sparkles
              className="h-4 w-4 shrink-0"
              style={{ color: theme.accentColor }}
              aria-hidden="true"
            />
            <span>Would one of these help?</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSimplifyClick(sentenceIndex, sentence)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition-colors hover:opacity-90"
              style={{
                backgroundColor: theme.buttonBg,
                borderColor: theme.buttonBorder,
                color: theme.textColor,
              }}
            >
              <Lightbulb
                className="h-4 w-4 shrink-0"
                style={{ color: theme.accentColor }}
                aria-hidden="true"
              />
              <span>Simpler sentence</span>
            </button>

            {onPictureClick && (
              <button
                type="button"
                onClick={() => onPictureClick(sentenceIndex, sentence)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition-colors hover:opacity-90"
                style={{
                  backgroundColor: theme.buttonBg,
                  borderColor: theme.buttonBorder,
                  color: theme.textColor,
                }}
              >
                <ImageIcon
                  className="h-4 w-4 shrink-0"
                  style={{ color: theme.accentColor }}
                  aria-hidden="true"
                />
                <span>Picture</span>
              </button>
            )}

            <a
              href={aslUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (onAslChoiceClick && keyWord) {
                  onAslChoiceClick(keyWord, sentence, sentenceIndex);
                }
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition-colors hover:opacity-90"
              style={{
                backgroundColor: theme.primaryBg,
                borderColor: theme.primaryBorder,
                color: theme.primaryText,
              }}
            >
              <Hand
                className="h-4 w-4 shrink-0"
                style={{ color: theme.primaryIconColor }}
                aria-hidden="true"
              />
              <span>ASL sign</span>
              <ExternalLink
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: theme.primaryIconColor }}
                aria-hidden="true"
              />
            </a>

            {onDismissEyeHint && (
              <button
                type="button"
                onClick={() => onDismissEyeHint(sentenceIndex)}
                aria-label="Close help choices"
                className="flex h-11 w-11 items-center justify-center rounded-xl border transition-colors hover:opacity-90"
                style={{
                  backgroundColor: theme.buttonBg,
                  borderColor: theme.buttonBorder,
                  color: theme.textColor,
                }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Visual Picture box (shown when "Picture" is chosen) */}
      {visual?.isOpen && (
        <div
          className="mt-4 rounded-xl border-2 p-4"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.accentColor,
            color: theme.textColor,
          }}
          aria-live="polite"
          data-testid={`visual-sentence-${sentenceIndex}`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div
              className="flex items-center gap-2 text-sm font-bold"
              style={{ color: theme.accentColor }}
            >
              <ImageIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Picture clue</span>
            </div>
            {onPictureClick && (
              <button
                type="button"
                onClick={() => onPictureClick(sentenceIndex, sentence)}
                aria-label="Hide picture clue"
                className="flex h-9 w-9 items-center justify-center rounded-lg border"
                style={{
                  backgroundColor: theme.buttonBg,
                  borderColor: theme.buttonBorder,
                  color: theme.textColor,
                }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {visual.status === 'loading' && (
            <p
              className="text-sm font-medium"
              style={{ color: theme.mutedTextColor }}
            >
              Making a picture clue...
            </p>
          )}

          {visual.status === 'success' && (
            <div className="flex flex-wrap items-center gap-4">
              <div
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-4xl"
                style={{
                  backgroundColor: theme.elevatedBg,
                  borderColor: theme.borderColor,
                }}
                aria-hidden="true"
              >
                {(visual.emojis || ['🦦']).map((emoji, idx) => (
                  <span key={idx}>{emoji}</span>
                ))}
              </div>
              <p
                className="text-base font-semibold"
                style={{ fontFamily, color: theme.textColor }}
              >
                {visual.caption}
              </p>
            </div>
          )}

          {visual.status === 'error' && (
            <p className="text-sm font-semibold">
              {visual.errorMessage || 'Could not load picture clue.'}
            </p>
          )}
        </div>
      )}

      {/* Simplified sentence rendered directly BELOW the original sentence */}
      {simplification.isOpen && (
        <div
          className="mt-4 rounded-xl border-2 p-4"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.accentColor,
            color: theme.textColor,
          }}
          aria-live="polite"
          data-testid={`simplified-sentence-${sentenceIndex}`}
        >
          <div
            className="mb-2 flex items-center gap-2 text-sm font-bold"
            style={{ color: theme.accentColor }}
          >
            <Lightbulb className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Simpler words</span>
          </div>

          {simplification.status === 'loading' && (
            <div className="space-y-2">
              <div
                className="h-4 w-4/5 animate-pulse rounded"
                style={{
                  backgroundColor: theme.isDark ? '#3F3F46' : '#CBD5E1',
                }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: theme.mutedTextColor }}
              >
                Making this sentence easier to read...
              </p>
            </div>
          )}

          {simplification.status === 'success' && simplification.simplified && (
            <p
              className="font-medium"
              style={{
                fontFamily,
                fontSize: `${fontSize}px`,
                lineHeight: lineSpacing,
                letterSpacing: `${letterSpacing}em`,
                color: theme.textColor,
              }}
            >
              {simplification.simplified}
            </p>
          )}

          {simplification.status === 'error' && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                className="text-sm font-semibold"
                style={{ color: theme.isDark ? '#FEF3C7' : '#78350F' }}
              >
                {simplification.errorMessage ||
                  'Could not simplify this sentence.'}
              </p>
              <button
                type="button"
                onClick={() => onSimplifyClick(sentenceIndex, sentence)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
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
        </div>
      )}
    </div>
  );
}
