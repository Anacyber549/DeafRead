import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAslDictionaryUrl,
  countWords,
  normalizeLookupWord,
  pickKeyWordFromSentence,
  tokenizeSentence,
} from './textParser';

test('normalizeLookupWord strips punctuation and lowercases words', () => {
  assert.equal(normalizeLookupWord('kelp.'), 'kelp');
  assert.equal(normalizeLookupWord('"Pacific"'), 'pacific');
  assert.equal(normalizeLookupWord("otter's,"), "otter's");
  assert.equal(normalizeLookupWord('   '), '');
});

test('tokenizeSentence preserves all characters and marks clickable words', () => {
  const sentence = 'Before going to sleep, otters wrap in kelp.';
  const tokens = tokenizeSentence(sentence);

  assert.equal(
    tokens.map((t) => t.text).join(''),
    sentence
  );

  const words = tokens.filter((t) => t.isWord);
  assert.equal(words.length, 8);
  assert.equal(words[3].cleanWord, 'sleep');
  assert.equal(words[7].cleanWord, 'kelp');
});

test('countWords accurately counts words across sentences', () => {
  const sentences = [
    'Sea otters are playful mammals.',
    'They live in kelp forests!',
  ];
  assert.equal(countWords(sentences), 10);
});

test('pickKeyWordFromSentence picks the richest non-stop word', () => {
  assert.equal(
    pickKeyWordFromSentence(
      'Instead, they rely on the densest fur of any animal on Earth for insulation.'
    ),
    'insulation'
  );
  assert.equal(
    pickKeyWordFromSentence(
      'Unlike whales or seals, sea otters do not have thick blubber to stay warm.'
    ),
    'blubber'
  );
});

test('buildAslDictionaryUrl creates valid Signing Savvy search links', () => {
  assert.equal(
    buildAslDictionaryUrl('urchins,'),
    'https://www.signingsavvy.com/search/urchins'
  );
  assert.equal(
    buildAslDictionaryUrl('...'),
    'https://www.signingsavvy.com/'
  );
});
