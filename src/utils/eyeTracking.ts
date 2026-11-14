export const EYE_DWELL_THRESHOLD_MS = 8000;
export const EYE_RETURN_THRESHOLD = 3;
export const EYE_COOLDOWN_MS = 30000;
export const EYE_JUMP_WINDOW_MS = 6000;
export const EYE_JUMP_SKIP_THRESHOLD = 2;
export const EYE_STABILIZE_MS = 250;

export type SentenceHintType = 'dwell' | 'returns';

export interface GazeTransition {
  fromIndex: number;
  toIndex: number;
  timestamp: number;
}

export interface EyeTrackingState {
  /** Confirmed current sentence index the student is looking at */
  activeSentenceIndex: number | null;
  /** Candidate sentence index being stabilized against brief jitter */
  pendingSentenceIndex: number | null;
  pendingSinceMs: number;
  /** Timestamp when current stabilized dwell started */
  dwellStartMs: number;
  /** How many times the student returned to each sentence after looking elsewhere */
  returnCounts: Record<number, number>;
  /** Sentence index -> epoch ms until which no help hint may be offered */
  cooldownUntilMs: Record<number, number>;
  /** Recent line-skip transitions for reading guide detection */
  recentSkips: number[];
  /** Whether reading guide (highlight active sentence, gently dim others) is active */
  readingGuideActive: boolean;
  /** Active soft visual hint (either 8s dwell or 3+ returns bubble) */
  activeHint: {
    sentenceIndex: number;
    type: SentenceHintType;
  } | null;
}

export interface SentenceRect {
  index: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function createInitialEyeTrackingState(): EyeTrackingState {
  return {
    activeSentenceIndex: null,
    pendingSentenceIndex: null,
    pendingSinceMs: 0,
    dwellStartMs: 0,
    returnCounts: {},
    cooldownUntilMs: {},
    recentSkips: [],
    readingGuideActive: false,
    activeHint: null,
  };
}

/**
 * Maps a screen-space gaze coordinate (x, y) to the closest sentence card index.
 * Uses vertical band matching with a small margin so eye tracking operates strictly
 * at the sentence card level, never word level.
 */
export function findSentenceAtGaze(
  x: number,
  y: number,
  rects: SentenceRect[],
  marginPx = 12
): number | null {
  if (!Number.isFinite(x) || !Number.isFinite(y) || rects.length === 0) {
    return null;
  }

  for (const rect of rects) {
    if (
      x >= rect.left - marginPx &&
      x <= rect.right + marginPx &&
      y >= rect.top - marginPx &&
      y <= rect.bottom + marginPx
    ) {
      return rect.index;
    }
  }

  return null;
}

/**
 * Checks whether a sentence is currently inside its 30-second help cooldown.
 */
export function isSentenceInCooldown(
  state: EyeTrackingState,
  sentenceIndex: number,
  nowMs: number
): boolean {
  const until = state.cooldownUntilMs[sentenceIndex];
  return typeof until === 'number' && nowMs < until;
}

/**
 * Dismisses the active hint for a sentence and starts its 30-second cooldown.
 */
export function markSentenceHelpOffered(
  state: EyeTrackingState,
  sentenceIndex: number,
  nowMs: number,
  dismissHint = false
): EyeTrackingState {
  return {
    ...state,
    cooldownUntilMs: {
      ...state.cooldownUntilMs,
      [sentenceIndex]: nowMs + EYE_COOLDOWN_MS,
    },
    activeHint:
      dismissHint && state.activeHint?.sentenceIndex === sentenceIndex
        ? null
        : state.activeHint,
  };
}

/**
 * Processes a sentence-level gaze observation at `nowMs`.
 * Pure & deterministic so every threshold (8s dwell, 3+ returns, jump/skip guide,
 * and 30s per-sentence cooldown) is unit-testable.
 */
export function processSentenceGaze(
  state: EyeTrackingState,
  observedSentenceIndex: number | null,
  nowMs: number
): EyeTrackingState {
  if (observedSentenceIndex === null) {
    return {
      ...state,
      pendingSentenceIndex: null,
      pendingSinceMs: 0,
    };
  }

  // First sentence ever looked at
  if (state.activeSentenceIndex === null) {
    return {
      ...state,
      activeSentenceIndex: observedSentenceIndex,
      pendingSentenceIndex: null,
      pendingSinceMs: 0,
      dwellStartMs: nowMs,
    };
  }

  // Still looking at the same active sentence
  if (observedSentenceIndex === state.activeSentenceIndex) {
    const nextState: EyeTrackingState = {
      ...state,
      pendingSentenceIndex: null,
      pendingSinceMs: 0,
    };

    const elapsedMs = nowMs - nextState.dwellStartMs;
    const inCooldown = isSentenceInCooldown(
      nextState,
      observedSentenceIndex,
      nowMs
    );

    if (
      elapsedMs > EYE_DWELL_THRESHOLD_MS &&
      !inCooldown &&
      nextState.activeHint === null
    ) {
      return {
        ...nextState,
        activeHint: {
          sentenceIndex: observedSentenceIndex,
          type: 'dwell',
        },
        cooldownUntilMs: {
          ...nextState.cooldownUntilMs,
          [observedSentenceIndex]: nowMs + EYE_COOLDOWN_MS,
        },
      };
    }

    return nextState;
  }

  // Looking at a different sentence: stabilize for EYE_STABILIZE_MS to ignore brief jitter
  if (state.pendingSentenceIndex !== observedSentenceIndex) {
    return {
      ...state,
      pendingSentenceIndex: observedSentenceIndex,
      pendingSinceMs: nowMs,
    };
  }

  if (nowMs - state.pendingSinceMs < EYE_STABILIZE_MS) {
    return state;
  }

  // Confirmed transition from activeSentenceIndex -> observedSentenceIndex
  const prevIndex = state.activeSentenceIndex;
  const nextIndex = observedSentenceIndex;
  const nextReturnCounts = {
    ...state.returnCounts,
    [nextIndex]: (state.returnCounts[nextIndex] ?? 0) + 1,
  };

  // Detect line skipping / jumping around (jumping >= 2 sentences at once)
  const isLineSkip = Math.abs(nextIndex - prevIndex) >= 2;
  const prunedSkips = state.recentSkips.filter(
    (t) => nowMs - t <= EYE_JUMP_WINDOW_MS
  );
  if (isLineSkip) {
    prunedSkips.push(nowMs);
  }
  const shouldActivateGuide =
    state.readingGuideActive || prunedSkips.length >= EYE_JUMP_SKIP_THRESHOLD;

  // Check if returning to this sentence 3 or more times triggers the 3-choice bubble
  const returnsToThisSentence = nextReturnCounts[nextIndex];
  const inCooldown = isSentenceInCooldown(state, nextIndex, nowMs);

  let nextHint = state.activeHint;
  // Clear stale dwell hint if student moved away to another sentence
  if (nextHint && nextHint.sentenceIndex !== nextIndex) {
    nextHint = null;
  }

  const nextCooldowns = { ...state.cooldownUntilMs };
  if (returnsToThisSentence >= EYE_RETURN_THRESHOLD && !inCooldown) {
    nextHint = {
      sentenceIndex: nextIndex,
      type: 'returns',
    };
    nextCooldowns[nextIndex] = nowMs + EYE_COOLDOWN_MS;
  }

  return {
    ...state,
    activeSentenceIndex: nextIndex,
    pendingSentenceIndex: null,
    pendingSinceMs: 0,
    dwellStartMs: nowMs,
    returnCounts: nextReturnCounts,
    cooldownUntilMs: nextCooldowns,
    recentSkips: prunedSkips,
    readingGuideActive: shouldActivateGuide,
    activeHint: nextHint,
  };
}

/**
 * Nine-point calibration grid positions in viewport percentages (3x3 layout).
 */
export interface CalibrationDot {
  id: number;
  xPercent: number;
  yPercent: number;
  label: string;
}

export const CALIBRATION_DOTS: CalibrationDot[] = [
  { id: 1, xPercent: 14, yPercent: 18, label: 'Top left' },
  { id: 2, xPercent: 50, yPercent: 18, label: 'Top middle' },
  { id: 3, xPercent: 86, yPercent: 18, label: 'Top right' },
  { id: 4, xPercent: 14, yPercent: 50, label: 'Middle left' },
  { id: 5, xPercent: 50, yPercent: 50, label: 'Center' },
  { id: 6, xPercent: 86, yPercent: 50, label: 'Middle right' },
  { id: 7, xPercent: 14, yPercent: 82, label: 'Bottom left' },
  { id: 8, xPercent: 50, yPercent: 82, label: 'Bottom middle' },
  { id: 9, xPercent: 86, yPercent: 82, label: 'Bottom right' },
];
