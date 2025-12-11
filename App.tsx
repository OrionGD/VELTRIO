
import React, { useState, useEffect } from 'react';
import TranslatorView from './components/TranslatorView';
import ConversationView from './components/ConversationView';
import LandingPage from './components/LandingPage';
import { SunIcon, MoonIcon } from './components/icons';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [mode, setMode] = useState<'translator' | 'conversation'>('translator');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 font-sans transition-colors duration-200 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/70 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    V
                </div>
                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                    VELTRIO
                </h1>
            </div>

            <div className="flex items-center gap-4">
                 <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Toggle Dark Mode"
                >
                    {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
      </header>

      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Navigation Tabs */}
          <div className="mb-8 flex justify-center">
              <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-xl inline-flex shadow-inner">
                  <button 
                    onClick={() => setMode('translator')} 
                    className={`relative px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'translator' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                  >
                      Translator
                  </button>
                  <button 
                    onClick={() => setMode('conversation')} 
                    className={`relative px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'conversation' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                  >
                      Conversation
                  </button>
              </div>
          </div>
          
          <div className="transition-all duration-300 ease-in-out">
            {mode === 'translator' ? <TranslatorView /> : <ConversationView />}
          </div>
        </div>
      </main>

      <footer className="w-full py-6 text-center text-sm text-gray-500 dark:text-gray-600 border-t border-gray-200 dark:border-gray-800/50">
        &copy; 2025 VELTRIO | Global Communicator
      </footer>
    </div>
  );
};

export default App;
