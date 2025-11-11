import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import QueryInput from '../components/QueryInput';
import WelcomeMessage from '../components/WelcomeMessage';
import UserMessage from '../components/UserMessage';
import AssistantMessage from '../components/AssistantMessage';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from '../hooks/useTranslation';

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

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  response?: QueryResponse;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslation();

  // Track user scrolling - if user scrolls up, disable auto-scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold

      // If user is near bottom, enable auto-scroll
      setShouldAutoScroll(isNearBottom);
      isUserScrollingRef.current = true;

      // Reset scrolling flag after user stops scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages are added (only if user is at bottom)
  useEffect(() => {
    if (shouldAutoScroll && !isUserScrollingRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, shouldAutoScroll]);

  // Listen for sidebar events
  useEffect(() => {
    const handleNewChat = () => {
      setMessages([]);
      setError('');
    };

    const handleClearConversation = () => {
      setMessages([]);
      setError('');
    };

    const handleLoadQuery = (event: CustomEvent) => {
      const query = event.detail?.query;
      if (query) {
        setMessages([]);
        setError('');
        // Trigger the query by calling handleQuerySubmit
        // We'll use a small delay to ensure state is cleared first
        setTimeout(() => {
          handleQuerySubmit(query);
        }, 100);
      }
    };

    window.addEventListener('sidebar:newChat', handleNewChat as EventListener);
    window.addEventListener('sidebar:clearConversation', handleClearConversation as EventListener);
    window.addEventListener('sidebar:loadQuery', handleLoadQuery as EventListener);

    return () => {
      window.removeEventListener('sidebar:newChat', handleNewChat as EventListener);
      window.removeEventListener('sidebar:clearConversation', handleClearConversation as EventListener);
      window.removeEventListener('sidebar:loadQuery', handleLoadQuery as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuerySubmit = async (query: string) => {
    console.log("Submitting query:", query);
    setLoading(true);
    setError('');

    // When user submits a query, enable auto-scroll to show their message and response
    setShouldAutoScroll(true);

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await api.query({ query, topK: 5 });

      // Add assistant message with response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.answer,
        response: result,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Save chat to Firestore
      const user = auth.currentUser;
      if (user) {
        try {
          await addDoc(collection(db, 'chats'), {
            userId: user.uid,
            query: query,
            timestamp: serverTimestamp(),
          });
        } catch (chatError) {
          console.error('Error saving chat to Firestore:', chatError);
          // Don't fail the query if chat save fails
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process query');
      // Remove the user message if query failed
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Scrollable messages area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        <div className="min-h-full flex flex-col">
          {messages.length === 0 && !loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <WelcomeMessage />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full px-4 py-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.type === 'user' ? (
                    <UserMessage content={message.content} />
                  ) : (
                    message.response && (
                      <AssistantMessage response={message.response} />
                    )
                  )}
                </div>
              ))}
              {loading && (
                <AssistantMessage 
                  response={{
                    answer: '',
                    citations: [],
                    sources: []
                  }}
                  isLoading={true}
                />
              )}
              {error && (
                <div className="flex justify-start mb-4">
                  <div className="max-w-3xl">
                    <div className="bg-destructive/20 border border-destructive/30 rounded-2xl rounded-tl-sm px-4 py-3 backdrop-blur-sm">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Query footer - input and disclaimer */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-t border-cyan-400/20 shadow-lg shadow-black/20">
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-4">
          <QueryInput 
            onQuerySubmit={handleQuerySubmit}
            isLoading={loading}
          />
        </div>
        <div className="px-4 pb-3">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card/20 backdrop-blur-sm border border-cyan-400/10 rounded-lg px-4 py-2.5">
              <p className="text-xs text-gray-700 dark:text-gray-400 leading-relaxed">
                {t('disclaimer')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
