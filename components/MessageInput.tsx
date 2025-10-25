import React, { useState, useRef, useEffect } from 'react';
import SendIcon from './icons/SendIcon';
import LoadingIcon from './icons/LoadingIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';

// Fix: Manually define types for the Web Speech API to resolve TypeScript errors.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

// Add SpeechRecognition to the window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof webkitSpeechRecognition;
  }
}

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleToggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
       if (event.error === 'not-allowed') {
        alert("Microphone permission denied. Please enable it in your browser settings.");
      }
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue((prevValue) => {
        const separator = prevValue.length > 0 && !prevValue.endsWith(' ') ? ' ' : '';
        return prevValue + separator + transcript;
      });
    };

    recognition.start();
  };
  
  // Clean up recognition instance on component unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 sm:space-x-4">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={isRecording ? "Listening..." : "Type your message..."}
        disabled={isLoading}
        className="flex-grow bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-full py-3 px-6 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={handleToggleRecording}
        disabled={isLoading}
        className={`w-14 h-14 flex-shrink-0 text-white rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 ${isRecording ? 'bg-red-700 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'} disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        <MicrophoneIcon className="w-6 h-6" />
      </button>
      <button
        type="submit"
        disabled={isLoading || !inputValue.trim()}
        className="w-14 h-14 flex-shrink-0 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500"
        aria-label="Send message"
      >
        {isLoading ? <LoadingIcon className="w-6 h-6" /> : <SendIcon className="w-6 h-6" />}
      </button>
    </form>
  );
};

export default MessageInput;