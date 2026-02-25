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
                recog.interimResults = false; // Só queremos o resultado final
                recog.lang = 'pt-BR';

                recog.onresult = (event: any) => {
                    let currentTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        currentTranscript += event.results[i][0].transcript;
                    }
                    setTranscript(currentTranscript);
                    if (callbackRef.current) {
                        callbackRef.current(currentTranscript);
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
            try {
                recognition.start();
                setIsRecording(true);
            } catch (e: any) {
                console.error("Failed to start recording:", e);
                setError("failed-to-start");
            }
        }
    }, [recognition]);

    const stopRecording = useCallback(() => {
        if (recognition) {
            recognition.stop();
            setIsRecording(false);
        }
    }, [recognition]);

    return {
        isRecording,
        transcript,
        startRecording,
        stopRecording,
        hasSupport: !!recognition,
        error,
    };
};
