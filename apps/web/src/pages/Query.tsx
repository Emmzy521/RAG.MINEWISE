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
        <h1 className="text-3xl font-bold">Query Documents</h1>
        <p className="text-muted-foreground mt-2">
          Ask questions about mining regulations and get AI-powered answers with source citations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
          <CardDescription>
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
                className="flex-1"
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
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {response && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Answer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none whitespace-pre-wrap">{response.answer}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sources</CardTitle>
              <CardDescription>Documents and chunks used to generate this answer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {response.sources.map((source, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-medium">Source {idx + 1}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Similarity: {(source.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {source.source}
                      {source.pageNumber && ` • Page ${source.pageNumber}`}
                    </p>
                    <p className="text-sm">{source.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {response.citations && response.citations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Citations</CardTitle>
                <CardDescription>Referenced documents</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {response.citations.map((citation, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {citation}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Disclaimer:</strong> This is an explanation based on the provided documents,
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
