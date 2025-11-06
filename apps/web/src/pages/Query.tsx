import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { api } from '../lib/api';
import { Search, FileText, Loader2 } from 'lucide-react';

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
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What are the environmental compliance requirements for mining operations?"
                className="flex-1 bg-background/50 border-cyan-400/20 text-white placeholder:text-gray-500 focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400/50"
              />
              <Button type="submit" disabled={loading || !query.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </form>
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
