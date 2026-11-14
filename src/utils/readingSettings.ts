export type FontChoice = 'lexend' | 'arial' | 'opendyslexic';

export type BgThemeId = 'white' | 'cream' | 'light-yellow' | 'black';

export interface ReadingSettings {
  font: FontChoice;
  fontSize: number;
  lineSpacing: number;
  letterSpacing: number;
  bgTheme: BgThemeId;
}

export interface FontOption {
  id: FontChoice;
  label: string;
  fontFamily: string;
  hint: string;
}

export interface BgThemeOption {
  id: BgThemeId;
  label: string;
  isDark: boolean;
  pageBg: string;
  cardBg: string;
  elevatedBg: string;
  borderColor: string;
  buttonBg: string;
  buttonBorder: string;
  textColor: string;
  mutedTextColor: string;
  swatchColor: string;
  accentColor: string;
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
  primaryBg: string;
  primaryBorder: string;
  primaryText: string;
  primaryIconColor: string;
  activeWordBg: string;
  activeWordBorder: string;
  sliderTrackColor: string;
  sliderThumbColor: string;
  sliderThumbBorder: string;
}

export const SETTING_LIMITS = {
  fontSize: { min: 16, max: 32, step: 1 },
  lineSpacing: { min: 1.4, max: 2.6, step: 0.1 },
  letterSpacing: { min: 0, max: 0.14, step: 0.01 },
} as const;

export const DEFAULT_READING_SETTINGS: ReadingSettings = {
  font: 'lexend',
  fontSize: 21,
  lineSpacing: 1.8,
  letterSpacing: 0.03,
  bgTheme: 'cream',
};

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'lexend',
    label: 'Lexend',
    fontFamily: '"Lexend", "Plus Jakarta Sans", Arial, sans-serif',
    hint: 'Smooth & open',
  },
  {
    id: 'arial',
    label: 'Arial',
    fontFamily: 'Arial, Helvetica, sans-serif',
    hint: 'Simple & classic',
  },
  {
    id: 'opendyslexic',
    label: 'OpenDyslexic',
    fontFamily: '"OpenDyslexic", "OpenDyslexicFallback", Arial, sans-serif',
    hint: 'Weighted letters',
  },
];

export const BG_THEMES: Record<BgThemeId, BgThemeOption> = {
  white: {
    id: 'white',
    label: 'White',
    isDark: false,
    pageBg: '#F1F5F9',
    cardBg: '#FFFFFF',
    elevatedBg: '#F8FAFC',
    borderColor: '#CBD5E1',
    buttonBg: '#FFFFFF',
    buttonBorder: '#CBD5E1',
    textColor: '#0F172A',
    mutedTextColor: '#334155',
    swatchColor: '#FFFFFF',
    accentColor: '#1D4ED8',
    selectedBg: '#EFF6FF',
    selectedBorder: '#1D4ED8',
    selectedText: '#172554',
    primaryBg: '#1D4ED8',
    primaryBorder: '#1D4ED8',
    primaryText: '#FFFFFF',
    primaryIconColor: '#FFFFFF',
    activeWordBg: '#DBEAFE',
    activeWordBorder: '#1D4ED8',
    sliderTrackColor: '#CBD5E1',
    sliderThumbColor: '#1D4ED8',
    sliderThumbBorder: '#FFFFFF',
  },
  cream: {
    id: 'cream',
    label: 'Cream',
    isDark: false,
    pageBg: '#F4EDE0',
    cardBg: '#FDF8EE',
    elevatedBg: '#F7EFE0',
    borderColor: '#D6C8B0',
    buttonBg: '#FDF8EE',
    buttonBorder: '#C7B69B',
    textColor: '#1C1917',
    mutedTextColor: '#44403C',
    swatchColor: '#FDF8EE',
    accentColor: '#1D4ED8',
    selectedBg: '#EFF6FF',
    selectedBorder: '#1D4ED8',
    selectedText: '#172554',
    primaryBg: '#1D4ED8',
    primaryBorder: '#1D4ED8',
    primaryText: '#FFFFFF',
    primaryIconColor: '#FFFFFF',
    activeWordBg: '#DBEAFE',
    activeWordBorder: '#1D4ED8',
    sliderTrackColor: '#D6C8B0',
    sliderThumbColor: '#1D4ED8',
    sliderThumbBorder: '#FFFFFF',
  },
  'light-yellow': {
    id: 'light-yellow',
    label: 'Light Yellow',
    isDark: false,
    pageBg: '#F5F0CA',
    cardBg: '#FEFCE8',
    elevatedBg: '#FAF5CE',
    borderColor: '#DDD28E',
    buttonBg: '#FEFCE8',
    buttonBorder: '#CEC06E',
    textColor: '#1C1917',
    mutedTextColor: '#422006',
    swatchColor: '#FEFCE8',
    accentColor: '#1D4ED8',
    selectedBg: '#EFF6FF',
    selectedBorder: '#1D4ED8',
    selectedText: '#172554',
    primaryBg: '#1D4ED8',
    primaryBorder: '#1D4ED8',
    primaryText: '#FFFFFF',
    primaryIconColor: '#FFFFFF',
    activeWordBg: '#DBEAFE',
    activeWordBorder: '#1D4ED8',
    sliderTrackColor: '#DDD28E',
    sliderThumbColor: '#1D4ED8',
    sliderThumbBorder: '#FFFFFF',
  },
  black: {
    id: 'black',
    label: 'Black',
    isDark: true,
    pageBg: '#000000',
    cardBg: '#1A1A1A',
    elevatedBg: '#121212',
    borderColor: '#555555',
    buttonBg: '#1A1A1A',
    buttonBorder: '#9CA3AF',
    textColor: '#FFFFFF',
    mutedTextColor: '#FFFFFF',
    swatchColor: '#000000',
    accentColor: '#8AB4FF',
    selectedBg: '#16243E',
    selectedBorder: '#8AB4FF',
    selectedText: '#FFFFFF',
    primaryBg: '#16243E',
    primaryBorder: '#8AB4FF',
    primaryText: '#FFFFFF',
    primaryIconColor: '#8AB4FF',
    activeWordBg: '#16243E',
    activeWordBorder: '#8AB4FF',
    sliderTrackColor: '#555555',
    sliderThumbColor: '#8AB4FF',
    sliderThumbBorder: '#000000',
  },
};

export function clampSettingValue(
  value: number,
  min: number,
  max: number
): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function getFontFamily(font: FontChoice): string {
  const found = FONT_OPTIONS.find((option) => option.id === font);
  return found ? found.fontFamily : FONT_OPTIONS[0].fontFamily;
}

export function getAdjacentSentenceIndex(
  currentIndex: number,
  direction: 'next' | 'back',
  totalSentences: number
): number {
  if (totalSentences <= 0) return 0;
  if (direction === 'next') {
    return Math.min(totalSentences - 1, currentIndex + 1);
  }
  return Math.max(0, currentIndex - 1);
}
