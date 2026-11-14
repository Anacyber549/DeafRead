import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BG_THEMES,
  clampSettingValue,
  getAdjacentSentenceIndex,
  getFontFamily,
} from './readingSettings';

test('clampSettingValue enforces min and max bounds', () => {
  assert.equal(clampSettingValue(12, 16, 32), 16);
  assert.equal(clampSettingValue(40, 16, 32), 32);
  assert.equal(clampSettingValue(22, 16, 32), 22);
  assert.equal(clampSettingValue(Number.NaN, 16, 32), 16);
});

test('getFontFamily returns matching font stacks for Lexend, Arial, and OpenDyslexic', () => {
  assert.match(getFontFamily('lexend'), /Lexend/);
  assert.match(getFontFamily('arial'), /Arial/);
  assert.match(getFontFamily('opendyslexic'), /OpenDyslexic/);
});

test('getAdjacentSentenceIndex stays within sentence bounds', () => {
  assert.equal(getAdjacentSentenceIndex(0, 'back', 10), 0);
  assert.equal(getAdjacentSentenceIndex(0, 'next', 10), 1);
  assert.equal(getAdjacentSentenceIndex(9, 'next', 10), 9);
  assert.equal(getAdjacentSentenceIndex(9, 'back', 10), 8);
});

test('page background themes include White, Cream, Light Yellow, and Black only', () => {
  assert.deepEqual(Object.keys(BG_THEMES), [
    'white',
    'cream',
    'light-yellow',
    'black',
  ]);

  assert.equal(BG_THEMES.black.pageBg, '#000000');
  assert.equal(BG_THEMES.black.textColor, '#FFFFFF');
  assert.equal(BG_THEMES.black.cardBg, '#1A1A1A');
  assert.equal(BG_THEMES.black.borderColor, '#555555');
  assert.equal(BG_THEMES.black.accentColor, '#8AB4FF');

  for (const theme of Object.values(BG_THEMES)) {
    assert.ok(theme.cardBg.startsWith('#'));
    assert.ok(theme.textColor.startsWith('#'));
    assert.ok(theme.accentColor.startsWith('#'));
  }
});
