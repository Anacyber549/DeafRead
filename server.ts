import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

interface WordHelpResult {
  word: string;
  baseWord: string;
  definition: string;
  emoji: string;
}

interface SimplifySentenceResult {
  original: string;
  simplified: string;
}

const wordCache = new Map<string, WordHelpResult>();
const sentenceCache = new Map<string, SimplifySentenceResult>();

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      }
    }
  }
  throw lastError;
}

const app = express();
app.use(express.json({ limit: '64kb' }));

app.post('/api/word-help', async (req, res) => {
  const rawWord = typeof req.body?.word === 'string' ? req.body.word.trim() : '';
  const sentence =
    typeof req.body?.sentence === 'string' ? req.body.sentence.trim() : '';

  if (!rawWord) {
    res.status(400).json({ error: 'Please provide a word to look up.' });
    return;
  }

  const cacheKey = `${rawWord.toLowerCase()}::${sentence.toLowerCase()}`;
  const cached = wordCache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const ai = getAiClient();
    const prompt = sentence
      ? `Word: "${rawWord}"\nSentence context: "${sentence}"\nGive a very easy English definition for a 10-year-old Deaf student with dyslexia, one clear emoji, and the base dictionary word.`
      : `Word: "${rawWord}"\nGive a very easy English definition for a 10-year-old Deaf student with dyslexia, one clear emoji, and the base dictionary word.`;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'You help Deaf students with dyslexia understand English words visually. ' +
            'Write definitions using very simple, everyday words in one short sentence (under 14 words). ' +
            'Do not mention sound, pronunciation, or rhyming. ' +
            'Pick exactly one clear, concrete emoji that shows the meaning. ' +
            'Return baseWord as the simple lowercase root form for an ASL dictionary search (for example, "bubbles" -> "bubble", "otters" -> "otter").',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              definition: {
                type: Type.STRING,
                description:
                  'A very simple, visual, kid-friendly definition in one short sentence under 14 words.',
              },
              emoji: {
                type: Type.STRING,
                description: 'Exactly one emoji showing the meaning of the word.',
              },
              baseWord: {
                type: Type.STRING,
                description:
                  'The simple lowercase root word for ASL dictionary lookup.',
              },
            },
            required: ['definition', 'emoji', 'baseWord'],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      definition?: string;
      emoji?: string;
      baseWord?: string;
    };

    const result: WordHelpResult = {
      word: rawWord,
      baseWord: (parsed.baseWord || rawWord).trim().toLowerCase(),
      definition:
        (parsed.definition || '').trim() ||
        `"${rawWord}" is a word from this story.`,
      emoji: (parsed.emoji || '📖').trim(),
    };

    wordCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/word-help:', error);
    const message =
      error instanceof Error ? error.message : 'Unable to look up word right now.';
    res.status(502).json({
      error: message.includes('GEMINI_API_KEY')
        ? 'Gemini API key is not configured.'
        : 'Could not get word help right now. Please try again.',
    });
  }
});

app.post('/api/simplify-sentence', async (req, res) => {
  const sentence =
    typeof req.body?.sentence === 'string' ? req.body.sentence.trim() : '';

  if (!sentence) {
    res.status(400).json({ error: 'Please provide a sentence to simplify.' });
    return;
  }

  const cacheKey = sentence.toLowerCase();
  const cached = sentenceCache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const ai = getAiClient();
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Rewrite this sentence in very simple English:\n"${sentence}"`,
        config: {
          systemInstruction:
            'You help Deaf students with dyslexia understand sentences easily. ' +
            'Rewrite the sentence using short, common, easy-to-read words and 1 or 2 very short sentences. ' +
            'Keep the exact meaning accurate. Do not add extra facts. Do not mention sound or audio.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              simplified: {
                type: Type.STRING,
                description:
                  'The sentence rewritten in very simple English using short words and short sentences.',
              },
            },
            required: ['simplified'],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      simplified?: string;
    };

    const result: SimplifySentenceResult = {
      original: sentence,
      simplified: (parsed.simplified || '').trim() || sentence,
    };

    sentenceCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/simplify-sentence:', error);
    const message =
      error instanceof Error ? error.message : 'Unable to simplify sentence right now.';
    res.status(502).json({
      error: message.includes('GEMINI_API_KEY')
        ? 'Gemini API key is not configured.'
        : 'Could not simplify this sentence right now. Please try again.',
    });
  }
});

interface SentenceVisualResult {
  emojis: string[];
  caption: string;
}

const sentenceVisualCache = new Map<string, SentenceVisualResult>();

app.post('/api/sentence-visual', async (req, res) => {
  const sentence =
    typeof req.body?.sentence === 'string' ? req.body.sentence.trim() : '';

  if (!sentence) {
    res.status(400).json({ error: 'Please provide a sentence.' });
    return;
  }

  const cacheKey = sentence.toLowerCase();
  const cached = sentenceVisualCache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const ai = getAiClient();
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Show this sentence visually with 2 or 3 clear emojis and a very short picture caption:\n"${sentence}"`,
        config: {
          systemInstruction:
            'You help Deaf students with dyslexia understand a sentence visually. ' +
            'Pick 2 or 3 clear, concrete emojis that tell the story of the sentence in order, ' +
            'and write a super short visual caption (under 8 easy words). Do not mention sound.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emojis: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 or 3 concrete emojis representing the sentence.',
              },
              caption: {
                type: Type.STRING,
                description: 'A very short easy-English caption under 8 words.',
              },
            },
            required: ['emojis', 'caption'],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      emojis?: string[];
      caption?: string;
    };

    const result: SentenceVisualResult = {
      emojis:
        Array.isArray(parsed.emojis) && parsed.emojis.length > 0
          ? parsed.emojis.slice(0, 3)
          : ['🦦', '🌊'],
      caption: (parsed.caption || '').trim() || 'Picture for this sentence',
    };

    sentenceVisualCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/sentence-visual:', error);
    res.status(502).json({
      error: 'Could not load a picture for this sentence right now.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SignRead server running on http://localhost:${PORT}`);
  });
}

startServer();
