import { useState, useEffect, useCallback, useRef } from 'react';

// Tipagem básica para a Web Speech API
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
    maxAlternatives: number;
}

declare global {
    interface Window {
        SpeechRecognition: {
            new(): SpeechRecognition;
        };
        webkitSpeechRecognition: {
            new(): SpeechRecognition;
        };
    }
}

export const useSpeechRecognition = (onResultCallback?: (text: string) => void) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Update the callback ref when it changes
    const callbackRef = useRef(onResultCallback);
    useEffect(() => {
        callbackRef.current = onResultCallback;
    }, [onResultCallback]);

    useEffect(() => {
        console.log("HOOK VRT3 - Initializing SpeechRecognition");
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recog = new SpeechRecognition();
                recog.continuous = false; // Parar quando o usuário parar de falar
                recog.interimResults = true; // Set to true to get results faster on mobile
                recog.lang = 'pt-BR';
                recog.maxAlternatives = 1;

                recog.onresult = (event: any) => {
                    let currentTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        currentTranscript += event.results[i][0].transcript;
                    }
                    setTranscript(currentTranscript);

                    // On mobile, sometimes it triggers onresult but doesn't auto-stop
                    // If it's final, we can stop it and trigger callback
                    if (event.results[0] && event.results[0].isFinal) {
                        if (callbackRef.current) {
                            callbackRef.current(currentTranscript);
                        }
                        recog.stop();
                        setIsRecording(false);
                    } else if (!recog.interimResults) {
                        // If we don't care about interim, and it triggered, it's usually final enough for our single-shot
                        if (callbackRef.current) {
                            callbackRef.current(currentTranscript);
                        }
                    }
                };

                recog.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setError(event.error);
                    setIsRecording(false);
                };

                recog.onend = () => {
                    setIsRecording(false);
                };

                setRecognition(recog);
            } else {
                console.warn('Speech Recognition API we not supported in this browser.');
                setError('not-supported');
            }
        }
    }, []); // Removed onResultCallback to prevent infinite re-renders

    const startRecording = useCallback(() => {
        if (recognition) {
            setError(null);
            setTranscript('');

            // On mobile, try-catch isn't enough, we need to ensure it's not already running
            if (isRecording) {
                recognition.stop();
            }

            try {
                recognition.start();
                setIsRecording(true);
            } catch (e: any) {
                console.error("Failed to start recording:", e);
                // Sometimes it fails if already started, just ignore or reset
                if (e.name === 'NotAllowedError') {
                    setError("not-allowed");
                } else {
                    setError("failed-to-start");
                }
                setIsRecording(false);
            }
        }
    }, [recognition, isRecording]);

    const stopRecording = useCallback(() => {
        if (recognition && isRecording) {
            try {
                recognition.stop();
            } catch (e) {
                console.warn('stop error', e);
            }
            setIsRecording(false);
        }
    }, [recognition, isRecording]);

    return {
        isRecording,
        transcript,
        startRecording,
        stopRecording,
        hasSupport: !!recognition,
        error,
    };
};
