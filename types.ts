
export enum SentimentLabel {
  Positive = 'Positive',
  Negative = 'Negative',
  Neutral = 'Neutral',
}

export interface SentimentResult {
  sentiment: SentimentLabel;
  explanation: string;
}

export interface Language {
  code: string;
  name: string;
}

export interface HistoryItem {
  id: string;
  inputText: string;
  translatedText: string;
  sentiment: SentimentResult;
  targetLanguage: string;
  targetLanguageName: string;
  timestamp: number;
}
