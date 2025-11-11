import { useState, useEffect, useRef } from 'react';
import { FileText, Loader2, ThumbsUp, ThumbsDown, Copy, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { useLanguage } from '../hooks/useLanguage';

interface QueryResponse {
  answer: string;
  citations: string[];
  sources: Array<{
    documentId: string;
    chunkId: string;
    content: string;
    score: number;
    source: string;
    pageNumber?: number;
  }>;
}

interface AssistantMessageProps {
  response: QueryResponse;
  isLoading?: boolean;
}

export default function AssistantMessage({ response, isLoading }: AssistantMessageProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { language } = useLanguage();

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop speech when new message arrives (component updates)
  useEffect(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [response.answer]);

  const handleThumbsUp = () => {
    setFeedback(feedback === 'up' ? null : 'up');
  };

  const handleThumbsDown = () => {
    setFeedback(feedback === 'down' ? null : 'down');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      // Stop speaking
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Start speaking
      const utterance = new SpeechSynthesisUtterance(response.answer);
      
      // Set language based on user preference
      const langMap: Record<string, string> = {
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'zh': 'zh-CN',
        'ar': 'ar-SA',
        'sw': 'sw-KE',
        'zu': 'zu-ZA',
      };
      utterance.lang = langMap[language] || 'en-US';
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-start mb-4 px-4">
        <div className="max-w-3xl">
          <div className="bg-card/50 backdrop-blur-sm border border-cyan-400/20 rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 px-4">
      <div className="max-w-3xl w-full space-y-4">
        {/* Answer */}
        <div className="bg-card/50 backdrop-blur-sm border border-cyan-400/20 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-gray-800 dark:text-gray-200 text-sm">
            {response.answer}
          </div>
          
          {/* Feedback Buttons */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cyan-400/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThumbsUp}
              className={`h-8 w-8 ${
                feedback === 'up'
                  ? 'text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10'
              }`}
              aria-label="Thumbs up"
            >
              <ThumbsUp className={`w-4 h-4 ${feedback === 'up' ? 'fill-current' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThumbsDown}
              className={`h-8 w-8 ${
                feedback === 'down'
                  ? 'text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10'
              }`}
              aria-label="Thumbs down"
            >
              <ThumbsDown className={`w-4 h-4 ${feedback === 'down' ? 'fill-current' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className={`h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 ${
                copied ? 'text-cyan-400 bg-cyan-400/10' : ''
              }`}
              aria-label="Copy answer"
            >
              <Copy className="w-4 h-4" />
            </Button>
            
            {('speechSynthesis' in window) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSpeak}
                className={`h-8 w-8 ${
                  isSpeaking
                    ? 'text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10'
                }`}
                aria-label={isSpeaking ? 'Stop speaking' : 'Read answer'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            )}
            
            {copied && (
              <span className="text-xs text-cyan-400 ml-1">Copied!</span>
            )}
          </div>
        </div>

        {/* Sources */}
        {response.sources && response.sources.length > 0 && (
          <Card className="bg-card/30 backdrop-blur-sm border-cyan-400/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-base">Sources</CardTitle>
              <CardDescription className="text-gray-700 dark:text-gray-400 text-xs">
                Documents and chunks used to generate this answer
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {response.sources.map((source, idx) => (
                  <div key={idx} className="border border-cyan-400/20 rounded-lg p-3 bg-background/30">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-3 h-3 text-cyan-400" />
                        <span className="font-medium text-gray-900 dark:text-white text-xs">Source {idx + 1}</span>
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-400">
                        Similarity: {(source.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-400 mb-1">
                      {source.source}
                      {source.pageNumber && ` • Page ${source.pageNumber}`}
                    </p>
                    <p className="text-xs text-gray-800 dark:text-gray-200 line-clamp-2">{source.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Citations */}
        {response.citations && response.citations.length > 0 && (
          <Card className="bg-card/30 backdrop-blur-sm border-cyan-400/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-base">Citations</CardTitle>
              <CardDescription className="text-gray-700 dark:text-gray-400 text-xs">
                Referenced documents
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="list-disc list-inside space-y-1">
                {response.citations.map((citation, idx) => (
                  <li key={idx} className="text-xs text-gray-700 dark:text-gray-400">
                    {citation}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

