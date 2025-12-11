
import React from 'react';
import { MicrophoneIcon, SpeakerIcon, PositiveIcon, SunIcon, MoonIcon } from './icons';

interface LandingPageProps {
  onStart: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, theme, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Toggle Theme Button */}
      <button
          onClick={toggleTheme}
          className="absolute right-6 top-6 p-2.5 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Toggle Dark Mode"
      >
          {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
      </button>

      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-300/30 dark:bg-purple-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-300/30 dark:bg-indigo-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 max-w-6xl w-full text-center py-10">
        <div className="mb-10 flex justify-center">
            <div className="relative group">
               <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 rounded-full"></div>
               <div className="relative bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
                   <SpeakerIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
               </div>
            </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-900 dark:from-white dark:via-indigo-300 dark:to-purple-400">
            VELTRIO
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
          Break down language barriers with AI-powered real-time translation, 
          sentiment analysis, and natural voice conversations.
        </p>

        <button 
          onClick={onStart}
          className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-indigo-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-xl hover:shadow-indigo-500/30 dark:ring-offset-gray-900"
        >
          Get Started
          <svg className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left mb-24">
            <div className="bg-white dark:bg-gray-800/60 backdrop-blur-md p-8 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all duration-300">
                <div className="bg-purple-50 dark:bg-purple-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                    <SpeakerIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Real-time Translation</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Instantly translate speech and text across multiple languages with high accuracy using Gemini 2.5.</p>
            </div>
            <div className="bg-white dark:bg-gray-800/60 backdrop-blur-md p-8 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-green-200 dark:hover:border-green-800 hover:shadow-lg transition-all duration-300">
                 <div className="bg-green-50 dark:bg-green-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                    <PositiveIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Sentiment Analysis</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Understand the emotional tone behind the words to communicate more effectively.</p>
            </div>
            <div className="bg-white dark:bg-gray-800/60 backdrop-blur-md p-8 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all duration-300">
                 <div className="bg-blue-50 dark:bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                    <MicrophoneIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Live Conversation</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Engage in fluid, natural voice conversations with low-latency AI models.</p>
            </div>
        </div>

        {/* Team Section */}
        <div className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-16">
            <h2 className="text-3xl font-bold mb-10 text-gray-900 dark:text-gray-100">Meet the Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {[
                    { initial: 'AS', name: 'Arjun S N', role: 'Lead Developer & Architect', color: 'indigo', desc: 'System architecture, state management strategies, and SDK integration.' },
                    { initial: 'AK', name: 'Aravindan K', role: 'AI Integration Specialist', color: 'purple', desc: 'Gemini Live API implementation, audio streaming, and speech pipeline.' },
                    { initial: 'GT', name: 'Godfrey T R', role: 'Frontend Engineer & UI/UX', color: 'blue', desc: 'User interface design, responsive layouts, and visual components.' }
                ].map((member, i) => (
                     <div key={i} className="group bg-white dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm 
                                ${member.color === 'indigo' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 
                                  member.color === 'purple' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 
                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                                {member.initial}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{member.name}</h3>
                                <p className={`text-xs font-semibold uppercase tracking-wide 
                                    ${member.color === 'indigo' ? 'text-indigo-500 dark:text-indigo-400' : 
                                      member.color === 'purple' ? 'text-purple-500 dark:text-purple-400' : 
                                      'text-blue-500 dark:text-blue-400'}`}>
                                    {member.role}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{member.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
      
      <footer className="absolute bottom-6 text-center w-full text-gray-400 dark:text-gray-600 text-sm">
        &copy; 2025 VELTRIO
      </footer>
    </div>
  );
};

export default LandingPage;
