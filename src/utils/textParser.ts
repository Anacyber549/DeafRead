export interface TextToken {
  text: string;
  isWord: boolean;
  cleanWord: string;
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'before',
  'by',
  'do',
  'does',
  'each',
  'even',
  'every',
  'for',
  'from',
  'have',
  'in',
  'inside',
  'instead',
  'is',
  'it',
  'its',
  'like',
  'not',
  'of',
  'often',
  'on',
  'or',
  'other',
  'so',
  'sometimes',
  'stay',
  'that',
  'the',
  'them',
  'themselves',
  'they',
  'to',
  'unlike',
  'use',
  'while',
  'with',
]);

/**
 * Strips leading/trailing punctuation while keeping internal apostrophes or hyphens.
 */
export function normalizeLookupWord(raw: string): string {
  return raw
    .trim()
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
    .toLowerCase();
}

/**
 * Splits a sentence into alternating word tokens and separator tokens (spaces/punctuation)
 * so every word can be rendered as an accessible button without losing exact spacing.
 */
export function tokenizeSentence(sentence: string): TextToken[] {
  if (!sentence) return [];

  const tokens: TextToken[] = [];
  const pattern = /([A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*)|([^A-Za-z0-9]+)/g;

  for (const match of sentence.matchAll(pattern)) {
    const wordPart = match[1];
    const separatorPart = match[2];

    if (wordPart) {
      tokens.push({
        text: wordPart,
        isWord: true,
        cleanWord: normalizeLookupWord(wordPart),
      });
    } else if (separatorPart) {
      tokens.push({
        text: separatorPart,
        isWord: false,
        cleanWord: '',
      });
    }
  }

  return tokens;
}

/**
 * Counts the total number of words across an array of sentences.
 */
export function countWords(sentences: string[]): number {
  return sentences.reduce((total, sentence) => {
    const words = tokenizeSentence(sentence).filter((t) => t.isWord);
    return total + words.length;
  }, 0);
}

/**
 * Picks the most meaningful content word in a sentence (e.g., for ASL sign lookup).
 */
export function pickKeyWordFromSentence(sentence: string): string {
  const words = tokenizeSentence(sentence)
    .filter((t) => t.isWord && t.cleanWord.length > 0)
    .map((t) => t.cleanWord);

  const candidates = words.filter((w) => !STOP_WORDS.has(w));
  if (candidates.length === 0) {
    return words[0] || '';
  }

  return candidates.reduce((best, current) =>
    current.length > best.length ? current : best
  );
}

/**
 * Builds an ASL video dictionary search link for a clicked word.
 */
export function buildAslDictionaryUrl(word: string): string {
  const normalized = normalizeLookupWord(word);
  if (!normalized) {
    return 'https://www.signingsavvy.com/';
  }
  return `https://www.signingsavvy.com/search/${encodeURIComponent(normalized)}`;
}
