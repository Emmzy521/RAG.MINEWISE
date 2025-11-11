import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Loader2, Mic, MicOff } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface QueryInputProps {
  onQuerySubmit: (query: string) => void | Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
}

// Type definitions for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function QueryInput({ 
  onQuerySubmit, 
  isLoading = false,
  placeholder
}: QueryInputProps) {
  const t = useTranslation();
  const defaultPlaceholder = placeholder || t('query.placeholder');
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isSupportedRef = useRef<boolean | null>(null);

  // Check browser support for speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    isSupportedRef.current = !!SpeechRecognition;
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = document.documentElement.lang || 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      // Process all results from the start to build complete transcript
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update query with final + interim results
      const fullTranscript = (finalTranscript + interimTranscript).trim();
      if (fullTranscript) {
        setQuery(fullTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert('Microphone permission denied. Please allow microphone access.');
      } else if (event.error === 'no-speech') {
        // User stopped speaking, this is normal
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!isSupportedRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    // Stop listening if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const queryToSubmit = query.trim();
    setQuery(''); // Clear input immediately
    await onQuerySubmit(queryToSubmit);
  };

  const isSpeechSupported = isSupportedRef.current !== false;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex space-x-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={defaultPlaceholder}
          className="flex-1 bg-background/80 dark:bg-background/80 bg-white/90 border-cyan-400/20 dark:border-cyan-400/20 border-gray-300 text-foreground dark:text-white text-gray-900 placeholder:text-gray-500 dark:placeholder:text-gray-500 placeholder:text-gray-400 focus-visible:border-cyan-400/50 dark:focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400/50 dark:focus-visible:ring-cyan-400/50 h-12 font-medium"
          disabled={isLoading || isListening}
        />
        {isSpeechSupported && (
          <Button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            className={`h-12 w-12 p-0 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isLoading || !query.trim()}
          className="bg-gradient-cyan text-white hover:opacity-90 hover:shadow-lg hover:shadow-cyan-500/50 h-12 px-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('query.searching')}
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              {t('query.search')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

