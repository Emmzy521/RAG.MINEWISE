import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { api } from '../lib/api';
import { FileText } from 'lucide-react';
import QueryInput from '../components/QueryInput';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

export default function Home() {
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuerySubmit = async (query: string) => {
    console.log("Submitting query:", query);
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const result = await api.query({ query, topK: 5 });
      setResponse(result);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-200px)] flex flex-col items-center justify-center">
      {/* Radial gradient background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] radial-glow opacity-50"></div>
      </div>

      {/* Main centered content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 space-y-12">
        {/* Central Query Area with Glow */}
        <div className="relative">
          <div className="absolute inset-0 radial-glow opacity-30"></div>
          <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-8 glow-border border-cyan-400/30">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-white">Ask a Question</CardTitle>
              <CardDescription className="text-gray-400">
                Enter your question about mining regulations in Zambia
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <QueryInput 
                onQuerySubmit={handleQuerySubmit}
                isLoading={loading}
                placeholder="e.g., What are the environmental compliance requirements for mining operations?"
              />
            </CardContent>
          </div>
        </div>

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

        {/* Legal Disclaimer - Show when no query results */}
        {!response && (
          <Card className="bg-card/30 backdrop-blur-sm border-cyan-400/10">
            <CardHeader>
              <CardTitle className="text-white">Legal Disclaimer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Minewise AI provides explanations based on uploaded documents and is not a substitute
                for professional legal advice. All responses are informational and should not be
                construed as formal legal advice. Please consult with qualified legal professionals for
                your specific situation.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
