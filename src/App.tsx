import { useCallback, useEffect, useRef, useState } from 'react';
import { CalibrationModal } from './components/CalibrationModal';
import { HeaderBar } from './components/HeaderBar';
import { ReadingStage } from './components/ReadingStage';
import {
  SentenceSimplificationState,
  SentenceVisualState,
} from './components/SentenceRow';
import { SettingsPanel } from './components/SettingsPanel';
import { WordHelpCard, WordHelpState } from './components/WordHelpCard';
import { ANIMAL_PASSAGE } from './data/passage';
import {
  SentenceVisualResponse,
  SimplifySentenceResponse,
  WordHelpResponse,
  fetchSentenceVisual,
  fetchSimplifiedSentence,
  fetchWordHelp,
} from './utils/apiClient';
import {
  EyeTrackingState,
  SentenceRect,
  createInitialEyeTrackingState,
  findSentenceAtGaze,
  markSentenceHelpOffered,
  processSentenceGaze,
} from './utils/eyeTracking';
import {
  BG_THEMES,
  BgThemeId,
  DEFAULT_READING_SETTINGS,
  ReadingSettings,
  getAdjacentSentenceIndex,
  getFontFamily,
} from './utils/readingSettings';
import {
  GazePoint,
  finishCalibration,
  recordCalibrationClick,
  startWebGazer,
  stopWebGazer,
} from './utils/webgazerClient';

const STORAGE_KEY = 'signread_reading_settings_v1';

function loadSavedSettings(): ReadingSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_READING_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ReadingSettings>;
    const validBgTheme: BgThemeId =
      parsed.bgTheme && parsed.bgTheme in BG_THEMES
        ? (parsed.bgTheme as BgThemeId)
        : DEFAULT_READING_SETTINGS.bgTheme;
    return {
      ...DEFAULT_READING_SETTINGS,
      ...parsed,
      bgTheme: validBgTheme,
    };
  } catch {
    return DEFAULT_READING_SETTINGS;
  }
}

function collectSentenceRects(): SentenceRect[] {
  const nodes = document.querySelectorAll<HTMLElement>('[data-sentence-index]');
  const rects: SentenceRect[] = [];
  nodes.forEach((node) => {
    const rawIdx = node.dataset.sentenceIndex;
    if (rawIdx === undefined) return;
    const index = Number(rawIdx);
    if (!Number.isInteger(index)) return;
    const box = node.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    rects.push({
      index,
      top: box.top,
      bottom: box.bottom,
      left: box.left,
      right: box.right,
    });
  });
  return rects;
}

export default function App() {
  const [settings, setSettings] = useState<ReadingSettings>(loadSavedSettings);
  const [oneSentenceMode, setOneSentenceMode] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(true);

  const [wordHelp, setWordHelp] = useState<WordHelpState>({
    selectedWord: '',
    sentence: '',
    status: 'idle',
  });
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<
    number | null
  >(null);

  const [simplifications, setSimplifications] = useState<
    Record<number, SentenceSimplificationState>
  >({});
  const [sentenceVisuals, setSentenceVisuals] = useState<
    Record<number, SentenceVisualState>
  >({});

  // Optional Eye Help state (OFF by default)
  const [eyeHelpEnabled, setEyeHelpEnabled] = useState(false);
  const [calibrationStatus, setCalibrationStatus] = useState<
    'closed' | 'starting' | 'calibrating' | 'error'
  >('closed');
  const [calibrationError, setCalibrationError] = useState<string | undefined>(
    undefined
  );
  const [calibrationAttempt, setCalibrationAttempt] = useState(0);
  const [eyeTrackingActive, setEyeTrackingActive] = useState(false);
  const [eyeState, setEyeState] = useState<EyeTrackingState>(
    createInitialEyeTrackingState
  );

  // Client-side caches for instant repeat clicks
  const wordCacheRef = useRef<Map<string, WordHelpResponse>>(new Map());
  const sentenceCacheRef = useRef<Map<number, SimplifySentenceResponse>>(
    new Map()
  );
  const visualCacheRef = useRef<Map<number, SentenceVisualResponse>>(new Map());
  const activeWordRequestRef = useRef(0);

  // Latest gaze coordinate from WebGazer & throttle tracking
  const lastGazeRef = useRef<GazePoint | null>(null);
  const lastProcessedGazeMsRef = useRef(0);
  const eyeSessionIdRef = useRef(0);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  // Ensure camera and WebGazer are always stopped if the component unmounts
  useEffect(() => {
    return () => {
      void stopWebGazer();
    };
  }, []);

  const processCurrentGaze = useCallback(() => {
    const point = lastGazeRef.current;
    if (!point) return;
    const rects = collectSentenceRects();
    const observedIndex = findSentenceAtGaze(point.x, point.y, rects);
    const now = Date.now();
    setEyeState((prev) => processSentenceGaze(prev, observedIndex, now));
  }, []);

  // Periodic tick while tracking is active so 8s dwell fires reliably even if gaze coordinates stay still
  useEffect(() => {
    if (!eyeTrackingActive) return;
    const timer = window.setInterval(() => {
      processCurrentGaze();
    }, 500);
    return () => window.clearInterval(timer);
  }, [eyeTrackingActive, processCurrentGaze]);

  const handleStopEyeTracking = useCallback(() => {
    eyeSessionIdRef.current += 1;
    lastGazeRef.current = null;
    setEyeHelpEnabled(false);
    setEyeTrackingActive(false);
    setCalibrationStatus('closed');
    setCalibrationError(undefined);
    setEyeState(createInitialEyeTrackingState());
    void stopWebGazer();
  }, []);

  const beginEyeCalibration = useCallback(async () => {
    const sessionId = ++eyeSessionIdRef.current;
    lastGazeRef.current = null;
    setEyeHelpEnabled(true);
    setEyeTrackingActive(false);
    setCalibrationError(undefined);
    setCalibrationAttempt((prev) => prev + 1);
    setCalibrationStatus('starting');
    setEyeState(createInitialEyeTrackingState());

    try {
      await startWebGazer((point) => {
        if (eyeSessionIdRef.current !== sessionId) return;
        lastGazeRef.current = point;
        const now = Date.now();
        if (now - lastProcessedGazeMsRef.current >= 150) {
          lastProcessedGazeMsRef.current = now;
          const rects = collectSentenceRects();
          const observedIndex = findSentenceAtGaze(point.x, point.y, rects);
          setEyeState((prev) => processSentenceGaze(prev, observedIndex, now));
        }
      });

      if (eyeSessionIdRef.current !== sessionId) {
        void stopWebGazer();
        return;
      }

      setCalibrationStatus('calibrating');
    } catch (error) {
      if (eyeSessionIdRef.current !== sessionId) return;
      void stopWebGazer();
      setCalibrationStatus('error');
      setCalibrationError(
        error instanceof Error
          ? error.message
          : 'Could not open your camera for Eye help.'
      );
    }
  }, []);

  const handleToggleEyeHelp = () => {
    if (eyeHelpEnabled || eyeTrackingActive || calibrationStatus !== 'closed') {
      handleStopEyeTracking();
      return;
    }
    void beginEyeCalibration();
  };

  const handleCalibrationDotClick = (_dotId: number, x: number, y: number) => {
    recordCalibrationClick(x, y);
  };

  const handleCalibrationComplete = () => {
    finishCalibration();
    setCalibrationStatus('closed');
    setEyeTrackingActive(true);
    setEyeState(createInitialEyeTrackingState());
  };

  const theme = BG_THEMES[settings.bgTheme] || BG_THEMES.cream;
  const readingFontFamily = getFontFamily(settings.font);

  const handleWordClick = async (
    word: string,
    sentence: string,
    sentenceIndex: number
  ) => {
    if (!word) return;

    const requestId = ++activeWordRequestRef.current;
    setSelectedSentenceIndex(sentenceIndex);

    const cacheKey = `${word.toLowerCase()}::${sentenceIndex}`;
    const cached = wordCacheRef.current.get(cacheKey);
    if (cached) {
      setWordHelp({
        selectedWord: word,
        sentence,
        status: 'success',
        data: cached,
      });
      return;
    }

    setWordHelp({
      selectedWord: word,
      sentence,
      status: 'loading',
    });

    if (window.innerWidth < 1024) {
      document
        .getElementById('word-help-anchor')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    try {
      const data = await fetchWordHelp(word, sentence);
      wordCacheRef.current.set(cacheKey, data);

      if (activeWordRequestRef.current !== requestId) return;

      setWordHelp({
        selectedWord: word,
        sentence,
        status: 'success',
        data,
      });
    } catch (error) {
      if (activeWordRequestRef.current !== requestId) return;

      setWordHelp({
        selectedWord: word,
        sentence,
        status: 'error',
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Could not load word help right now.',
      });
    }
  };

  const handleRetryWordHelp = () => {
    if (!wordHelp.selectedWord || selectedSentenceIndex === null) return;
    void handleWordClick(
      wordHelp.selectedWord,
      wordHelp.sentence,
      selectedSentenceIndex
    );
  };

  const handleCloseWordHelp = () => {
    activeWordRequestRef.current += 1;
    setSelectedSentenceIndex(null);
    setWordHelp({
      selectedWord: '',
      sentence: '',
      status: 'idle',
    });
  };

  const handleSimplifyClick = async (
    sentenceIndex: number,
    sentence: string
  ) => {
    const existing = simplifications[sentenceIndex];

    // Respect 30s cooldown & clear any active eye hint for this sentence
    setEyeState((prev) =>
      markSentenceHelpOffered(prev, sentenceIndex, Date.now(), true)
    );

    // Toggle closed if already open with a successful simplification
    if (existing?.isOpen && existing.status === 'success') {
      setSimplifications((prev) => ({
        ...prev,
        [sentenceIndex]: { ...existing, isOpen: false },
      }));
      return;
    }

    // Re-open cached simplification instantly
    const cached = sentenceCacheRef.current.get(sentenceIndex);
    if (cached) {
      setSimplifications((prev) => ({
        ...prev,
        [sentenceIndex]: {
          status: 'success',
          isOpen: true,
          simplified: cached.simplified,
        },
      }));
      return;
    }

    // Prevent duplicate in-flight fetch
    if (existing?.status === 'loading') return;

    setSimplifications((prev) => ({
      ...prev,
      [sentenceIndex]: {
        status: 'loading',
        isOpen: true,
      },
    }));

    try {
      const result = await fetchSimplifiedSentence(sentence);
      sentenceCacheRef.current.set(sentenceIndex, result);
      setSimplifications((prev) => ({
        ...prev,
        [sentenceIndex]: {
          status: 'success',
          isOpen: true,
          simplified: result.simplified,
        },
      }));
    } catch (error) {
      setSimplifications((prev) => ({
        ...prev,
        [sentenceIndex]: {
          status: 'error',
          isOpen: true,
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Could not simplify this sentence right now.',
        },
      }));
    }
  };

  const handlePictureClick = async (
    sentenceIndex: number,
    sentence: string
  ) => {
    const existing = sentenceVisuals[sentenceIndex];

    setEyeState((prev) =>
      markSentenceHelpOffered(prev, sentenceIndex, Date.now(), true)
    );

    if (existing?.isOpen && existing.status === 'success') {
      setSentenceVisuals((prev) => ({
        ...prev,
        [sentenceIndex]: { ...existing, isOpen: false },
      }));
      return;
    }

    const cached = visualCacheRef.current.get(sentenceIndex);
    if (cached) {
      setSentenceVisuals((prev) => ({
        ...prev,
        [sentenceIndex]: {
          status: 'success',
          isOpen: true,
          emojis: cached.emojis,
          caption: cached.caption,
        },
      }));
      return;
    }

    if (existing?.status === 'loading') return;

    setSentenceVisuals((prev) => ({
      ...prev,
      [sentenceIndex]: {
        status: 'loading',
        isOpen: true,
      },
    }));

    try {
      const result = await fetchSentenceVisual(sentence);
      visualCacheRef.current.set(sentenceIndex, result);
      setSentenceVisuals((prev) => ({
        ...prev,
        [sentenceIndex]: {
          status: 'success',
          isOpen: true,
          emojis: result.emojis,
          caption: result.caption,
        },
      }));
    } catch (error) {
      setSentenceVisuals((prev) => ({
        ...prev,
        [sentenceIndex]: {
          status: 'error',
          isOpen: true,
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Could not load a picture clue right now.',
        },
      }));
    }
  };

  const handleAslChoiceClick = (
    word: string,
    sentence: string,
    sentenceIndex: number
  ) => {
    setEyeState((prev) =>
      markSentenceHelpOffered(prev, sentenceIndex, Date.now(), true)
    );
    void handleWordClick(word, sentence, sentenceIndex);
  };

  const handleDismissEyeHint = (sentenceIndex: number) => {
    setEyeState((prev) =>
      markSentenceHelpOffered(prev, sentenceIndex, Date.now(), true)
    );
  };

  const handleTurnOffReadingGuide = () => {
    setEyeState((prev) => ({
      ...prev,
      readingGuideActive: false,
      recentSkips: [],
    }));
  };

  const handleChangeSentenceIndex = (direction: 'next' | 'back') => {
    setCurrentSentenceIndex((prev) =>
      getAdjacentSentenceIndex(
        prev,
        direction,
        ANIMAL_PASSAGE.sentences.length
      )
    );
  };

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={
        {
          backgroundColor: theme.pageBg,
          color: theme.textColor,
          '--slider-track': theme.sliderTrackColor,
          '--slider-thumb': theme.sliderThumbColor,
          '--slider-thumb-border': theme.sliderThumbBorder,
          '--signread-focus': theme.accentColor,
        } as React.CSSProperties
      }
    >
      <a
        href="#reading-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-blue-700 focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to story
      </a>

      <HeaderBar
        theme={theme}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings((prev) => !prev)}
        eyeTrackingActive={eyeTrackingActive}
        onStopEyeTracking={handleStopEyeTracking}
      />

      <main
        id="reading-main"
        className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Primary Reading Area */}
          <div className="order-2 lg:order-none lg:col-span-8">
            <ReadingStage
              passage={ANIMAL_PASSAGE}
              theme={theme}
              fontFamily={readingFontFamily}
              fontSize={settings.fontSize}
              lineSpacing={settings.lineSpacing}
              letterSpacing={settings.letterSpacing}
              oneSentenceMode={oneSentenceMode}
              onToggleOneSentenceMode={setOneSentenceMode}
              currentSentenceIndex={currentSentenceIndex}
              onChangeSentenceIndex={handleChangeSentenceIndex}
              selectedWord={
                wordHelp.status !== 'idle' ? wordHelp.selectedWord : null
              }
              selectedSentenceIndex={selectedSentenceIndex}
              simplifications={simplifications}
              sentenceVisuals={sentenceVisuals}
              readingGuideActive={eyeTrackingActive && eyeState.readingGuideActive}
              gazeSentenceIndex={
                eyeTrackingActive ? eyeState.activeSentenceIndex : null
              }
              activeEyeHint={eyeTrackingActive ? eyeState.activeHint : null}
              onWordClick={handleWordClick}
              onSimplifyClick={handleSimplifyClick}
              onPictureClick={handlePictureClick}
              onAslChoiceClick={handleAslChoiceClick}
              onDismissEyeHint={handleDismissEyeHint}
              onTurnOffReadingGuide={handleTurnOffReadingGuide}
            />
          </div>

          {/* Right Workspace Rail: Word Help + Reading Settings */}
          <aside
            aria-label="Word help and reading settings"
            className={`space-y-5 lg:col-span-4 lg:sticky lg:top-6 lg:order-none ${
              wordHelp.status !== 'idle' ? 'order-1' : 'order-3'
            }`}
          >
            <div id="word-help-anchor">
              <WordHelpCard
                state={wordHelp}
                theme={theme}
                fontFamily={readingFontFamily}
                onClose={handleCloseWordHelp}
                onRetry={handleRetryWordHelp}
              />
            </div>

            {showSettings && (
              <SettingsPanel
                settings={settings}
                theme={theme}
                eyeHelpEnabled={eyeHelpEnabled}
                onToggleEyeHelp={handleToggleEyeHelp}
                onChange={setSettings}
              />
            )}
          </aside>
        </div>
      </main>

      {calibrationStatus !== 'closed' && (
        <CalibrationModal
          key={calibrationAttempt}
          theme={theme}
          status={calibrationStatus}
          errorMessage={calibrationError}
          onDotClick={handleCalibrationDotClick}
          onComplete={handleCalibrationComplete}
          onRetry={() => void beginEyeCalibration()}
          onCancel={handleStopEyeTracking}
        />
      )}
    </div>
  );
}
