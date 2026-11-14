import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CALIBRATION_DOTS,
  EYE_COOLDOWN_MS,
  EYE_DWELL_THRESHOLD_MS,
  EYE_STABILIZE_MS,
  createInitialEyeTrackingState,
  findSentenceAtGaze,
  markSentenceHelpOffered,
  processSentenceGaze,
} from './eyeTracking';

test('CALIBRATION_DOTS provides 9 distinct calibration targets', () => {
  assert.equal(CALIBRATION_DOTS.length, 9);
});

test('findSentenceAtGaze maps gaze coordinates to sentence card bounds', () => {
  const rects = [
    { index: 0, top: 100, bottom: 180, left: 50, right: 700 },
    { index: 1, top: 200, bottom: 280, left: 50, right: 700 },
  ];
  assert.equal(findSentenceAtGaze(200, 140, rects), 0);
  assert.equal(findSentenceAtGaze(200, 240, rects), 1);
  assert.equal(findSentenceAtGaze(200, 500, rects), null);
});

test('dwelling on the same sentence for more than 8 seconds triggers dwell hint and 30s cooldown', () => {
  let state = createInitialEyeTrackingState();
  state = processSentenceGaze(state, 0, 1000);
  assert.equal(state.activeHint, null);

  // At exactly 8000ms (not > 8000ms), hint does not fire yet
  state = processSentenceGaze(state, 0, 1000 + EYE_DWELL_THRESHOLD_MS);
  assert.equal(state.activeHint, null);

  // Past 8000ms -> dwell hint triggers
  state = processSentenceGaze(state, 0, 1000 + EYE_DWELL_THRESHOLD_MS + 100);
  assert.deepEqual(state.activeHint, { sentenceIndex: 0, type: 'dwell' });

  // Dismiss hint and verify cooldown blocks re-offering within 30s
  state = markSentenceHelpOffered(state, 0, 9100, true);
  assert.equal(state.activeHint, null);

  // Even after dwelling 10 more seconds (19100 < 9100 + 30000), cooldown blocks it
  state = processSentenceGaze(state, 0, 19500);
  assert.equal(state.activeHint, null);

  // Move to sentence 1 and back to sentence 0 after 30s cooldown expires
  state = processSentenceGaze(state, 1, 40000);
  state = processSentenceGaze(state, 1, 40000 + EYE_STABILIZE_MS);
  state = processSentenceGaze(state, 0, 41000);
  state = processSentenceGaze(state, 0, 41000 + EYE_STABILIZE_MS);
  state = processSentenceGaze(
    state,
    0,
    41000 + EYE_STABILIZE_MS + EYE_DWELL_THRESHOLD_MS + 100
  );
  assert.deepEqual(state.activeHint, { sentenceIndex: 0, type: 'dwell' });
});

test('returning to the same sentence 3 or more times shows the 3-choice help bubble and respects 30s cooldown', () => {
  let state = createInitialEyeTrackingState();
  let now = 0;

  const focusSentence = (idx: number) => {
    now += 400;
    state = processSentenceGaze(state, idx, now);
    now += EYE_STABILIZE_MS + 10;
    state = processSentenceGaze(state, idx, now);
  };

  // Initial read of sentence 2
  focusSentence(2);
  assert.equal(state.activeHint, null);

  // Return 1
  focusSentence(3);
  focusSentence(2);
  assert.equal(state.returnCounts[2], 1);
  assert.equal(state.activeHint, null);

  // Return 2
  focusSentence(3);
  focusSentence(2);
  assert.equal(state.returnCounts[2], 2);
  assert.equal(state.activeHint, null);

  // Return 3 -> triggers 'returns' bubble
  focusSentence(3);
  focusSentence(2);
  assert.equal(state.returnCounts[2], 3);
  assert.deepEqual(state.activeHint, { sentenceIndex: 2, type: 'returns' });

  // Return 4 within 30s -> must NOT re-offer help for sentence 2
  state = { ...state, activeHint: null };
  focusSentence(3);
  focusSentence(2);
  assert.equal(state.returnCounts[2], 4);
  assert.equal(state.activeHint, null);

  // After 30s cooldown passes, another return can offer help again
  now += EYE_COOLDOWN_MS + 1000;
  focusSentence(3);
  focusSentence(2);
  assert.deepEqual(state.activeHint, { sentenceIndex: 2, type: 'returns' });
});

test('skipping lines / jumping gaze turns on reading guide', () => {
  let state = createInitialEyeTrackingState();
  let now = 1000;

  const focusSentence = (idx: number) => {
    now += 300;
    state = processSentenceGaze(state, idx, now);
    now += EYE_STABILIZE_MS + 10;
    state = processSentenceGaze(state, idx, now);
  };

  focusSentence(0);
  // Skip line: 0 -> 3 (diff 3 >= 2)
  focusSentence(3);
  assert.equal(state.readingGuideActive, false);

  // Skip again: 3 -> 1 (diff 2 >= 2) within 6s window -> Reading guide activates
  focusSentence(1);
  assert.equal(state.readingGuideActive, true);
});
