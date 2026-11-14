import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Eye,
  List,
  Sparkles,
} from 'lucide-react';
import { ReadingPassage } from '../data/passage';
import { SentenceHintType } from '../utils/eyeTracking';
import { BgThemeOption } from '../utils/readingSettings';
import {
  SentenceRow,
  SentenceSimplificationState,
  SentenceVisualState,
} from './SentenceRow';

interface ReadingStageProps {
  passage: ReadingPassage;
  theme: BgThemeOption;
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  letterSpacing: number;
  oneSentenceMode: boolean;
  onToggleOneSentenceMode: (enabled: boolean) => void;
  currentSentenceIndex: number;
  onChangeSentenceIndex: (direction: 'next' | 'back') => void;
  selectedWord: string | null;
  selectedSentenceIndex: number | null;
  simplifications: Record<number, SentenceSimplificationState>;
  sentenceVisuals: Record<number, SentenceVisualState>;
  readingGuideActive: boolean;
  gazeSentenceIndex: number | null;
  activeEyeHint: {
    sentenceIndex: number;
    type: SentenceHintType;
  } | null;
  onWordClick: (word: string, sentence: string, sentenceIndex: number) => void;
  onSimplifyClick: (sentenceIndex: number, sentence: string) => void;
  onPictureClick: (sentenceIndex: number, sentence: string) => void;
  onAslChoiceClick: (
    word: string,
    sentence: string,
    sentenceIndex: number
  ) => void;
  onDismissEyeHint: (sentenceIndex: number) => void;
  onTurnOffReadingGuide: () => void;
}

export function ReadingStage({
  passage,
  theme,
  fontFamily,
  fontSize,
  lineSpacing,
  letterSpacing,
  oneSentenceMode,
  onToggleOneSentenceMode,
  currentSentenceIndex,
  onChangeSentenceIndex,
  selectedWord,
  selectedSentenceIndex,
  simplifications,
  sentenceVisuals,
  readingGuideActive,
  gazeSentenceIndex,
  activeEyeHint,
  onWordClick,
  onSimplifyClick,
  onPictureClick,
  onAslChoiceClick,
  onDismissEyeHint,
  onTurnOffReadingGuide,
}: ReadingStageProps) {
  const [imageError, setImageError] = useState(false);
  const totalSentences = passage.sentences.length;
  const activeSentence = passage.sentences[currentSentenceIndex] || '';
  const progressPercent = Math.round(
    ((currentSentenceIndex + 1) / totalSentences) * 100
  );

  const defaultSimplification: SentenceSimplificationState = {
    status: 'idle',
    isOpen: false,
  };

  return (
    <article
      className="rounded-2xl border p-5 sm:p-8 transition-colors duration-200"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
        color: theme.textColor,
      }}
    >
      {/* Story Header & Illustration */}
      <div className="mb-6">
        <div
          className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold"
          style={{ color: theme.mutedTextColor }}
        >
          <span>{passage.gradeLevel}</span>
          <span aria-hidden="true">·</span>
          <span>{passage.topic}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{passage.wordCount} words</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
          {passage.title}
        </h1>

        {!oneSentenceMode && (
          <div
            className="mt-4 overflow-hidden rounded-xl border"
            style={{ borderColor: theme.borderColor }}
          >
            {!imageError ? (
              <img
                src={passage.imageSrc}
                alt={passage.imageAlt}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="aspect-video max-h-[220px] w-full scale-[1.03] object-cover"
              />
            ) : (
              <div
                className="flex aspect-video max-h-[220px] w-full flex-col items-center justify-center gap-2 p-6 text-center"
                style={{ backgroundColor: theme.elevatedBg }}
              >
                <BookOpen
                  className="h-10 w-10"
                  style={{ color: theme.accentColor }}
                  aria-hidden="true"
                />
                <p className="text-base font-semibold">{passage.title}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mode toggle bar right above reading text */}
      <div
        className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
        style={{
          backgroundColor: theme.elevatedBg,
          borderColor: theme.borderColor,
        }}
      >
        <p className="text-sm font-semibold" style={{ color: theme.mutedTextColor }}>
          Click any word for help, or click{' '}
          <strong style={{ color: theme.textColor }}>I don't understand</strong>{' '}
          for easier words.
        </p>

        <button
          type="button"
          onClick={() => onToggleOneSentenceMode(!oneSentenceMode)}
          aria-pressed={oneSentenceMode}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold whitespace-nowrap shrink-0 transition-colors hover:opacity-90"
          style={
            oneSentenceMode
              ? {
                  borderColor: theme.primaryBorder,
                  backgroundColor: theme.primaryBg,
                  color: theme.primaryText,
                }
              : {
                  borderColor: theme.buttonBorder,
                  backgroundColor: theme.buttonBg,
                  color: theme.textColor,
                }
          }
        >
          {oneSentenceMode ? (
            <>
              <List
                className="h-5 w-5 shrink-0"
                style={{ color: theme.primaryIconColor }}
                aria-hidden="true"
              />
              <span>Show all sentences</span>
            </>
          ) : (
            <>
              <Eye
                className="h-5 w-5 shrink-0"
                style={{ color: theme.accentColor }}
                aria-hidden="true"
              />
              <span>One sentence at a time</span>
            </>
          )}
        </button>
      </div>

      {/* Soft Reading Guide banner (activated when gaze jumps around / skips lines) */}
      {readingGuideActive && !oneSentenceMode && (
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 px-4 py-2.5 transition-opacity duration-300"
          style={{
            backgroundColor: theme.elevatedBg,
            borderColor: theme.accentColor,
            color: theme.textColor,
          }}
          role="status"
          data-testid="reading-guide-banner"
        >
          <div className="flex items-center gap-2 text-sm font-bold">
            <Sparkles
              className="h-4 w-4 shrink-0"
              style={{ color: theme.accentColor }}
              aria-hidden="true"
            />
            <span>Reading guide is on to help keep your place.</span>
          </div>
          <button
            type="button"
            onClick={onTurnOffReadingGuide}
            className="min-h-[36px] rounded-lg border px-3 py-1 text-xs font-bold transition-colors hover:opacity-90"
            style={{
              backgroundColor: theme.buttonBg,
              borderColor: theme.buttonBorder,
              color: theme.textColor,
            }}
          >
            Turn off guide
          </button>
        </div>
      )}

      {/* Reading Body */}
      {!oneSentenceMode ? (
        <div className="space-y-4">
          {passage.sentences.map((sentence, index) => (
            <SentenceRow
              key={index}
              sentenceIndex={index}
              sentence={sentence}
              selectedWord={selectedWord}
              selectedSentenceIndex={selectedSentenceIndex}
              theme={theme}
              fontFamily={fontFamily}
              fontSize={fontSize}
              lineSpacing={lineSpacing}
              letterSpacing={letterSpacing}
              simplification={simplifications[index] || defaultSimplification}
              visual={sentenceVisuals[index]}
              readingGuideActive={readingGuideActive}
              isGazeTarget={gazeSentenceIndex === index}
              eyeHint={
                activeEyeHint?.sentenceIndex === index
                  ? activeEyeHint.type
                  : null
              }
              onWordClick={onWordClick}
              onSimplifyClick={onSimplifyClick}
              onPictureClick={onPictureClick}
              onAslChoiceClick={onAslChoiceClick}
              onDismissEyeHint={onDismissEyeHint}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6" data-testid="one-sentence-view">
          {/* Sentence progress header */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm font-bold">
              <span className="tabular-nums">
                Sentence {currentSentenceIndex + 1} of {totalSentences}
              </span>
              <span
                className="tabular-nums"
                style={{ color: theme.mutedTextColor }}
              >
                {progressPercent}%
              </span>
            </div>
            <div
              className="h-3 w-full overflow-hidden rounded-full border"
              style={{
                backgroundColor: theme.elevatedBg,
                borderColor: theme.borderColor,
              }}
              role="progressbar"
              aria-valuenow={currentSentenceIndex + 1}
              aria-valuemin={1}
              aria-valuemax={totalSentences}
              aria-label="Reading progress"
            >
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: theme.accentColor,
                }}
              />
            </div>
          </div>

          {/* Focused single sentence */}
          <SentenceRow
            key={currentSentenceIndex}
            sentenceIndex={currentSentenceIndex}
            sentence={activeSentence}
            selectedWord={selectedWord}
            selectedSentenceIndex={selectedSentenceIndex}
            theme={theme}
            fontFamily={fontFamily}
            fontSize={fontSize + 2}
            lineSpacing={lineSpacing}
            letterSpacing={letterSpacing}
            simplification={
              simplifications[currentSentenceIndex] || defaultSimplification
            }
            visual={sentenceVisuals[currentSentenceIndex]}
            isFocusMode
            eyeHint={
              activeEyeHint?.sentenceIndex === currentSentenceIndex
                ? activeEyeHint.type
                : null
            }
            onWordClick={onWordClick}
            onSimplifyClick={onSimplifyClick}
            onPictureClick={onPictureClick}
            onAslChoiceClick={onAslChoiceClick}
            onDismissEyeHint={onDismissEyeHint}
          />

          {/* Big Back & Next navigation buttons */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => onChangeSentenceIndex('back')}
              disabled={currentSentenceIndex === 0}
              className="flex min-h-[60px] items-center justify-center gap-3 rounded-2xl border-2 px-6 py-4 text-lg font-bold transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: theme.buttonBg,
                borderColor: theme.buttonBorder,
                color: theme.textColor,
              }}
            >
              <ArrowLeft className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeSentenceIndex('next')}
              disabled={currentSentenceIndex === totalSentences - 1}
              className="flex min-h-[60px] items-center justify-center gap-3 rounded-2xl border-2 px-6 py-4 text-lg font-bold shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: theme.primaryBg,
                borderColor: theme.primaryBorder,
                color: theme.primaryText,
              }}
            >
              <span>Next</span>
              <ArrowRight
                className="h-6 w-6 shrink-0"
                style={{ color: theme.primaryIconColor }}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
