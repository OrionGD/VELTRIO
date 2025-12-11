
import React from 'react';
import { SentimentResult, SentimentLabel } from '../types';
import { PositiveIcon, NegativeIcon, NeutralIcon, SpinnerIcon } from './icons';

interface SentimentDisplayProps {
  sentimentResult: SentimentResult | null;
  isLoading: boolean;
}

const sentimentConfig = {
  [SentimentLabel.Positive]: {
    icon: PositiveIcon,
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-500/10',
    label: 'Positive',
  },
  [SentimentLabel.Negative]: {
    icon: NegativeIcon,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-500/10',
    label: 'Negative',
  },
  [SentimentLabel.Neutral]: {
    icon: NeutralIcon,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-500/10',
    label: 'Neutral',
  },
};

const SentimentDisplay: React.FC<SentimentDisplayProps> = ({ sentimentResult, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <SpinnerIcon className="animate-spin h-10 w-10 mb-3" />
        <p>Analyzing sentiment...</p>
      </div>
    );
  }

  if (!sentimentResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <NeutralIcon className="h-12 w-12 mb-3" />
        <p>Sentiment will be analyzed here.</p>
      </div>
    );
  }

  const config = sentimentConfig[sentimentResult.sentiment];
  const IconComponent = config.icon;

  return (
    <div className={`p-6 rounded-lg h-full flex flex-col items-center justify-center text-center transition-colors ${config.bgColor}`}>
      <IconComponent className={`w-16 h-16 mb-4 ${config.color}`} />
      <h3 className={`text-2xl font-bold ${config.color}`}>{config.label}</h3>
      <p className="text-gray-600 dark:text-gray-300 mt-2">{sentimentResult.explanation}</p>
    </div>
  );
};

export default SentimentDisplay;
