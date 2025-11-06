import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../lib/api';
import { FileText } from 'lucide-react';
import QueryInput from '../components/QueryInput';

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

export default function Query() {
  const location = useLocation();
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handles the query submission from the QueryInput component.
   * This function will be passed as a prop to QueryInput.
   */
  const handleQuerySubmit = async (query: string) => {
    console.log("Submitting query:", query);
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const result = await api.query({ query, topK: 5 });
      setResponse(result);
    } catch (err: any) {
      setError(err.message || 'Failed to process query');
    } finally {
      setLoading(false);
    }
  };
  
  // Check if we have an initial query from navigation state
  useEffect(() => {
    const state = location.state as { initialQuery?: string } | null;
    if (state?.initialQuery) {
      // Auto-submit the query when navigating from Home page
      handleQuerySubmit(state.initialQuery);
      // Clear the state to prevent re-submission on re-render
      window.history.replaceState({}, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Query Documents</h1>
        <p className="text-gray-300 mt-2">
          Ask questions about mining regulations and get AI-powered answers with source citations
        </p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-cyan-400/20">
        <CardHeader>
          <CardTitle className="text-white">Ask a Question</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your question about mining regulations in Zambia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QueryInput 
            onQuerySubmit={handleQuerySubmit}
            isLoading={loading}
            placeholder="e.g., What are the environmental compliance requirements for mining operations?"
          />
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {response && (
        <>
          <Card className="bg-card/50 backdrop-blur-sm border-cyan-400/20">
            <CardHeader>
              <CardTitle className="text-white">Answer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none whitespace-pre-wrap text-gray-200">{response.answer}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-cyan-400/20">
            <CardHeader>
              <CardTitle className="text-white">Sources</CardTitle>
              <CardDescription className="text-gray-400">Documents and chunks used to generate this answer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {response.sources.map((source, idx) => (
                  <div key={idx} className="border border-cyan-400/20 rounded-lg p-4 bg-background/30">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span className="font-medium text-white">Source {idx + 1}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        Similarity: {(source.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      {source.source}
                      {source.pageNumber && ` • Page ${source.pageNumber}`}
                    </p>
                    <p className="text-sm text-gray-200">{source.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {response.citations && response.citations.length > 0 && (
            <Card className="bg-card/50 backdrop-blur-sm border-cyan-400/20">
              <CardHeader>
                <CardTitle className="text-white">Citations</CardTitle>
                <CardDescription className="text-gray-400">Referenced documents</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {response.citations.map((citation, idx) => (
                    <li key={idx} className="text-sm text-gray-400">
                      {citation}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card/30 backdrop-blur-sm border-cyan-400/10">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">
                <strong className="text-white">Disclaimer:</strong> This is an explanation based on the provided documents,
                not formal legal advice. Please consult with qualified legal professionals for your
                specific situation.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
