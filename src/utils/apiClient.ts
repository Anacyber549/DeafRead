export interface WordHelpResponse {
  word: string;
  baseWord: string;
  definition: string;
  emoji: string;
}

export interface SimplifySentenceResponse {
  original: string;
  simplified: string;
}

export interface SentenceVisualResponse {
  emojis: string[];
  caption: string;
}

export async function fetchWordHelp(
  word: string,
  sentence: string
): Promise<WordHelpResponse> {
  const response = await fetch('/api/word-help', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, sentence }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'Could not get word help right now.'
    );
  }

  return data as WordHelpResponse;
}

export async function fetchSimplifiedSentence(
  sentence: string
): Promise<SimplifySentenceResponse> {
  const response = await fetch('/api/simplify-sentence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'Could not simplify this sentence right now.'
    );
  }

  return data as SimplifySentenceResponse;
}

export async function fetchSentenceVisual(
  sentence: string
): Promise<SentenceVisualResponse> {
  const response = await fetch('/api/sentence-visual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === 'string'
        ? data.error
        : 'Could not load a picture right now.'
    );
  }

  return data as SentenceVisualResponse;
}
