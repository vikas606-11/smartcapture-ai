import React, { useState, useEffect, useRef } from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';

export const VoiceInput = ({ onTranscript, onError }) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for web speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      let friendlyError = 'Speech recognition failed.';
      if (event.error === 'not-allowed') {
        friendlyError = 'Microphone permission blocked. Please check your browser settings.';
      } else if (event.error === 'no-speech') {
        friendlyError = 'No speech detected. Please try again.';
      } else if (event.error === 'network') {
        friendlyError = 'Network error during speech recognition.';
      }
      
      if (onError) {
        onError(friendlyError);
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onTranscript && transcript) {
        onTranscript(transcript);
      }
    };

    recognitionRef.current = recognition;
  }, [onTranscript, onError]);

  const handleToggle = () => {
    if (!supported) {
      if (onError) {
        onError('Voice input is not supported in this browser. Please use Google Chrome.');
      }
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  return (
    <div className="flex items-center space-x-2.5">
      <button
        type="button"
        onClick={handleToggle}
        className={`p-3 rounded-xl border flex items-center justify-center transition-all duration-300 relative focus:outline-none focus:ring-2 focus:ring-brand-500/80 ${
          isListening
            ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
            : 'bg-slate-100 hover:bg-slate-200/85 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:border-slate-700 text-slate-655 dark:text-slate-350'
        }`}
        title={isListening ? 'Stop Recording' : 'Record Voice'}
      >
        {isListening ? (
          <FiMicOff className="w-5 h-5 z-10" />
        ) : (
          <FiMic className="w-5 h-5" />
        )}
        
        {/* Pulsing red animation outer ring */}
        {isListening && (
          <span className="absolute inset-0 rounded-xl bg-rose-500/40 animate-ping -z-0" />
        )}
      </button>

      {isListening && (
        <span className="text-xs font-bold text-rose-500 dark:text-rose-400 animate-pulse tracking-wide uppercase">
          Listening...
        </span>
      )}
    </div>
  );
};

export default VoiceInput;
