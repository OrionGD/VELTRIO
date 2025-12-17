
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from "@google/genai";
import { decode, decodeAudioData, createBlob } from '../utils/audio';
import { MicrophoneIcon, StopIcon, SpinnerIcon } from './icons';

declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

type TranscriptEntry = {
    speaker: 'You' | 'Gemini';
    text: string;
};

const ConversationView: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
    const [connectionStatus, setConnectionStatus] = useState<string>('');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string>('');
    
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const ai = useRef<GoogleGenAI | null>(null);
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());

    const scrollToBottom = () => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [transcript]);

    const cleanUp = useCallback(() => {
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        inputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);
        
        for (const source of audioSourcesRef.current.values()) {
            source.stop();
        }
        audioSourcesRef.current.clear();

        sessionPromiseRef.current = null;
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        mediaStreamRef.current = null;
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';
        nextStartTimeRef.current = 0;
    }, []);

    const stopSession = useCallback(async () => {
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
        }
        cleanUp();
        setStatus('idle');
        setConnectionStatus('');
    }, [cleanUp]);
    
    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);

    const handleMessage = useCallback(async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            currentOutputTranscriptionRef.current += text;
        } else if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            currentInputTranscriptionRef.current += text;
        }

        if (message.serverContent?.turnComplete) {
            const fullInput = currentInputTranscriptionRef.current.trim();
            const fullOutput = currentOutputTranscriptionRef.current.trim();
            
            setTranscript(prev => {
                const newTranscript = [...prev];
                if (fullInput) newTranscript.push({ speaker: 'You', text: fullInput });
                if (fullOutput) newTranscript.push({ speaker: 'Gemini', text: fullOutput });
                return newTranscript;
            });

            currentInputTranscriptionRef.current = '';
            currentOutputTranscriptionRef.current = '';
        }
        
        const interrupted = message.serverContent?.interrupted;
        if (interrupted) {
            for (const source of audioSourcesRef.current.values()) {
                source.stop();
                audioSourcesRef.current.delete(source);
            }
            nextStartTimeRef.current = 0;
        }

        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        
        if (base64Audio && outputAudioContextRef.current) {
            const outputCtx = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            try {
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                source.addEventListener('ended', () => {
                    audioSourcesRef.current.delete(source);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                audioSourcesRef.current.add(source);
            } catch (e) {
                console.error("Error decoding audio:", e);
            }
        }
    }, []);

    const startSession = useCallback(async () => {
        setStatus('connecting');
        setConnectionStatus('Initializing...');
        setError('');
        setTranscript([]);

        try {
            if (!ai.current) {
                const API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
                if (!API_KEY) {
                    throw new Error("API_KEY environment variable not set");
                }
                ai.current = new GoogleGenAI({ apiKey: API_KEY });
            }

            setConnectionStatus('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            setConnectionStatus('Setting up audio streams...');
            const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });

            setConnectionStatus('Connecting to Gemini Live...');
            sessionPromiseRef.current = ai.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputCtx.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                        setStatus('active');
                        setConnectionStatus('');
                    },
                    onmessage: handleMessage,
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setError('Connection failed. Please check your network or API key.');
                        setStatus('error');
                        cleanUp();
                    },
                    onclose: (e: CloseEvent) => {
                        cleanUp();
                        setStatus('idle');
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: 'You are a helpful and friendly AI assistant. Respond in the same language the user is speaking. Keep your responses concise and conversational.',
                },
            });

        } catch (err: any) {
            console.error("Failed to start session:", err);
            setError(err.message || "Could not start session. Check permissions and try again.");
            setStatus('error');
            cleanUp();
        }
    }, [cleanUp, handleMessage]);

    return (
        <div className="flex flex-col h-[75vh] max-h-[800px] bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">
            {/* Header / Status Bar */}
            <div className="absolute top-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700 p-4 z-10 flex justify-center">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
                    status === 'active' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    status === 'connecting' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    status === 'error' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                    <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-red-500 animate-pulse' : status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'}`}></span>
                    {status === 'idle' ? 'Ready to Chat' : 
                     status === 'active' ? 'Live Conversation' : 
                     status === 'connecting' ? 'Connecting' : 'Error'}
                </div>
            </div>

            {/* Chat Transcript Area */}
            <div className="flex-grow overflow-y-auto p-6 pt-20 pb-32 space-y-6 scroll-smooth">
                {transcript.length === 0 && status !== 'active' && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 opacity-60">
                         <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <MicrophoneIcon className="w-8 h-8" />
                         </div>
                        <p className="text-lg font-medium">Start talking to Gemini</p>
                    </div>
                )}
                
                {transcript.map((entry, index) => (
                    <div key={index} className={`flex ${entry.speaker === 'You' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm leading-relaxed ${
                            entry.speaker === 'You' 
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-none' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-600'
                        }`}>
                            <p className="text-xs font-bold mb-1 opacity-70 uppercase tracking-wider">{entry.speaker}</p>
                            <p className="whitespace-pre-wrap">{entry.text}</p>
                        </div>
                    </div>
                ))}
                
                {status === 'connecting' && (
                    <div className="flex justify-center my-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">{connectionStatus}</span>
                    </div>
                )}
                
                <div ref={transcriptEndRef} />
            </div>

            {/* Bottom Controls Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center">
                 {error && <p className="text-red-500 text-sm mb-3 font-medium">{error}</p>}
                 
                 <div className="relative group">
                    {/* Ripple Effect */}
                    {status === 'active' && (
                        <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-20"></div>
                    )}
                    
                    <button
                        onClick={status === 'active' || status === 'connecting' ? stopSession : startSession}
                        disabled={status === 'connecting'}
                        className={`relative z-10 p-5 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                            status === 'active' 
                                ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-400'
                        } ${status === 'connecting' ? 'cursor-wait opacity-80' : ''}`}
                    >
                        {status === 'connecting' ? (
                            <SpinnerIcon className="w-8 h-8 animate-spin" />
                        ) : status === 'active' ? (
                            <StopIcon className="w-8 h-8" />
                        ) : (
                            <MicrophoneIcon className="w-8 h-8" />
                        )}
                    </button>
                 </div>
                 <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {status === 'active' ? 'Tap to stop' : status === 'connecting' ? 'Connecting...' : 'Tap to start conversation'}
                 </p>
            </div>
        </div>
    );
};

export default ConversationView;
