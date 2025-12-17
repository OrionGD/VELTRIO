
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { translateText, analyzeSentiment } from '../services/geminiService';
import { SentimentResult, Language, HistoryItem, SentimentLabel } from '../types';
import { LANGUAGES } from '../constants';
import SentimentDisplay from './SentimentDisplay';
import { MicrophoneIcon, StopIcon, SpinnerIcon, SpeakerIcon, HistoryIcon, TrashIcon, CloseIcon, PositiveIcon, NegativeIcon, NeutralIcon } from './icons';

// Extend the Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const HISTORY_STORAGE_KEY = 'translationHistory';

const TranslatorView: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [debouncedInputText, setDebouncedInputText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('es');
  
  // Input language for speech recognition
  const [inputLanguage, setInputLanguage] = useState<string>(() => {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.split('-')[0];
      return LANGUAGES.some(l => l.code === browserLang) ? browserLang : 'en';
    }
    return 'en';
  });

  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  
  // Granular loading states
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState<boolean>(false);
  
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryPanelVisible, setIsHistoryPanelVisible] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1);

  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInputText(inputText);
    }, 800);

    return () => {
      clearTimeout(handler);
    };
  }, [inputText]);
  
  const addToHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    setHistory(prevHistory => {
      const newItem: HistoryItem = {
        ...item,
        id: new Date().toISOString() + Math.random(),
        timestamp: Date.now(),
      };
      // Avoid adding exact duplicates
      if (prevHistory.some(h => h.inputText === newItem.inputText && h.translatedText === newItem.translatedText && h.targetLanguage === newItem.targetLanguage)) {
        return prevHistory;
      }
      return [newItem, ...prevHistory].slice(0, 50);
    });
  }, []);

  useEffect(() => {
    if (!debouncedInputText.trim()) {
      setTranslatedText('');
      setSentiment(null);
      setError('');
      return;
    }

    const processTranslationAndSentiment = async () => {
      setError('');
      setIsTranslating(true);
      setIsAnalyzingSentiment(true);
      
      let currentTranslation = '';
      let currentSentiment: SentimentResult | null = null;
      let translationError = false;

      // Handle Translation
      const translationPromise = translateText(debouncedInputText, targetLanguage)
        .then(text => {
          setTranslatedText(text);
          currentTranslation = text;
          return text;
        })
        .catch(e => {
          console.error("Translation error:", e);
          translationError = true;
          return '';
        })
        .finally(() => {
          setIsTranslating(false);
        });

      // Handle Sentiment
      const sentimentPromise = analyzeSentiment(debouncedInputText)
        .then(result => {
          setSentiment(result);
          currentSentiment = result;
          return result;
        })
        .catch(e => {
          console.error("Sentiment error:", e);
          return null;
        })
        .finally(() => {
          setIsAnalyzingSentiment(false);
        });

      await Promise.all([translationPromise, sentimentPromise]);

      if (translationError) {
          setError("Failed to translate text. Please try again.");
      } else if (currentTranslation && currentSentiment) {
          const targetLanguageName = LANGUAGES.find(l => l.code === targetLanguage)?.name || '';
          addToHistory({
            inputText: debouncedInputText,
            translatedText: currentTranslation,
            sentiment: currentSentiment,
            targetLanguage,
            targetLanguageName,
          });
      }
    };

    processTranslationAndSentiment();
  }, [debouncedInputText, targetLanguage, addToHistory]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = inputLanguage;
    
    recognition.onstart = () => {
      setIsRecording(true);
      setError('');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInputText(prev => {
            const trimmed = prev.trim();
            const newText = finalTranscript.trim();
            return trimmed ? `${trimmed} ${newText}` : newText;
        });
      }
    };
    
    recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
             setError('Microphone access denied. Please allow permission.');
             setIsRecording(false);
        } else if (event.error === 'no-speech') {
             return;
        } else {
             setError(`Speech recognition error: ${event.error}`);
             setIsRecording(false);
        }
    };

    recognition.onend = () => {
        setIsRecording(false);
    };
    
    recognitionRef.current = recognition;
    
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
    };
  }, []);

  // Handle input language changes dynamically
  useEffect(() => {
      if (recognitionRef.current) {
          recognitionRef.current.lang = inputLanguage;
          if (isRecording) {
              recognitionRef.current.stop();
          }
      }
  }, [inputLanguage]);

  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
        setError("Speech recognition is not supported in this browser.");
        return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setError('');
      recognitionRef.current.lang = inputLanguage;
      try {
        recognitionRef.current.start();
      } catch (e) {
         console.error("Could not start recognition", e);
         setError("Could not start microphone. Refresh and try again.");
      }
    }
  };

  const handleSpeak = useCallback(() => {
    if (!translatedText) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = targetLanguage;
    utterance.rate = speechRate;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      setError("Text-to-speech error.");
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [translatedText, targetLanguage, isSpeaking, speechRate]);
  
  useEffect(() => {
    return () => {
        window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
  }, [translatedText]);

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };
  
  const loadFromHistory = (item: HistoryItem) => {
    setInputText(item.inputText);
    setTargetLanguage(item.targetLanguage);
    setIsHistoryPanelVisible(false);
  };
  
  const renderSentimentIcon = (sentiment: SentimentLabel) => {
    const baseClassName = "w-5 h-5";
    switch(sentiment) {
      case SentimentLabel.Positive: return <PositiveIcon className={`${baseClassName} text-green-500 dark:text-green-400`} />;
      case SentimentLabel.Negative: return <NegativeIcon className={`${baseClassName} text-red-500 dark:text-red-400`} />;
      default: return <NeutralIcon className={`${baseClassName} text-gray-400`} />;
    }
  };

  const handleClearInput = () => {
    setInputText('');
    setTranslatedText('');
    setSentiment(null);
    setError('');
    textareaRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Top Controls Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="flex flex-col sm:flex-row gap-2 w-full">
                <select
                  value={inputLanguage}
                  onChange={(e) => setInputLanguage(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-48 transition-colors"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
                
                <div className="hidden sm:flex items-center justify-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>

                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-48 transition-colors"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
             </div>
        </div>
        
        <button 
            onClick={() => setIsHistoryPanelVisible(true)} 
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        >
            <HistoryIcon className="w-5 h-5" />
            <span className="text-sm font-medium">History</span>
        </button>
      </div>

      {/* Main Translation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Input Area */}
          <div className="relative group flex flex-col h-full min-h-[300px] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
             <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Input ({LANGUAGES.find(l => l.code === inputLanguage)?.name})</span>
                {inputText && (
                    <button onClick={handleClearInput} className="text-gray-400 hover:text-red-500 transition-colors" title="Clear">
                        <CloseIcon className="w-4 h-4" />
                    </button>
                )}
             </div>
             <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or speak..."
                className="flex-grow w-full p-4 bg-transparent border-none resize-none focus:ring-0 text-lg leading-relaxed placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
             />
             <div className="p-4 flex justify-end">
                <button
                  onClick={handleToggleRecording}
                  disabled={!window.SpeechRecognition && !window.webkitSpeechRecognition}
                  className={`p-3 rounded-full transition-all duration-300 shadow-lg ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white scale-110' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600'}`}
                  title={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isRecording ? <StopIcon className="w-6 h-6 animate-pulse" /> : <MicrophoneIcon className="w-6 h-6" />}
                </button>
             </div>
          </div>

          {/* Output Area */}
          <div className="relative flex flex-col h-full min-h-[300px] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all">
             <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Translation ({LANGUAGES.find(l => l.code === targetLanguage)?.name})</span>
                {isTranslating && <SpinnerIcon className="w-4 h-4 animate-spin text-indigo-500" />}
             </div>
             
             <div className="flex-grow p-4 overflow-y-auto">
                 {translatedText ? (
                    <p className="text-lg leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{translatedText}</p>
                 ) : (
                    <p className="text-gray-400 dark:text-gray-600 italic">Translation will appear here...</p>
                 )}
                 {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
             </div>

             <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                {translatedText && (
                    <>
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600">
                             <span className="text-xs font-mono text-gray-500 dark:text-gray-300 w-6 text-right">{speechRate}x</span>
                             <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.25"
                                value={speechRate}
                                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                                className="w-20 h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                             />
                        </div>
                        <button 
                            onClick={handleSpeak} 
                            className={`p-2 rounded-full transition-colors ${isSpeaking ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                            title="Listen"
                        >
                            {isSpeaking ? <StopIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                        </button>
                    </>
                )}
             </div>
          </div>
      </div>

      {/* Sentiment Analysis Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
             <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Sentiment Analysis</span>
        </div>
        <div className="p-6">
            <SentimentDisplay sentimentResult={sentiment} isLoading={isAnalyzingSentiment} />
        </div>
      </div>
      
      {/* History Slide-over */}
      <div className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isHistoryPanelVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsHistoryPanelVisible(false)}></div>
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isHistoryPanelVisible ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full text-gray-900 dark:text-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold">Translation History</h2>
                <button onClick={() => setIsHistoryPanelVisible(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {history.length > 0 ? (
                history.map(item => (
                    <div key={item.id} className="group bg-gray-50 dark:bg-gray-800 p-4 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-700/70 border border-gray-200 dark:border-gray-700 transition-all relative" onClick={() => loadFromHistory(item)}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0 mr-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.inputText}</p>
                                <p className="font-medium text-gray-900 dark:text-gray-200 line-clamp-2">{item.translatedText}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-white dark:bg-gray-600 text-gray-400 hover:text-red-500 shadow-sm transition-all">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700/50 mt-2">
                           <div className="flex items-center gap-1">
                             {renderSentimentIcon(item.sentiment.sentiment)}
                             <span>{item.sentiment.sentiment}</span>
                           </div>
                           <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                           <span>{item.targetLanguageName}</span>
                           <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                           <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <HistoryIcon className="w-12 h-12 mb-3 opacity-20" />
                    <p>No history yet</p>
                </div>
            )}
            </div>

            {history.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <button onClick={clearHistory} className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2 font-medium">
                        <TrashIcon className="w-4 h-4" /> Clear All History
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TranslatorView;
