import { useState } from 'react';
import { Button } from './ui/button';
import { Search, Sparkles, Loader2 } from 'lucide-react';

interface HomeQueryInputProps {
  onQuerySubmit: (query: string) => void | Promise<void>;
  isLoading?: boolean;
}

export default function HomeQueryInput({ 
  onQuerySubmit, 
  isLoading = false
}: HomeQueryInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    await onQuerySubmit(query.trim());
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 radial-glow opacity-30"></div>
      <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-8 glow-border border-cyan-400/30">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 text-cyan-400 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium">Ask anything about mining regulations</span>
              </div>
              <div className={`w-full h-16 bg-background/50 border rounded-lg flex items-center px-4 transition-all ${
                query.trim() 
                  ? 'border-cyan-400/50 glow-border-focus' 
                  : 'border-cyan-400/20 hover:glow-border-focus hover:border-cyan-400/50'
              }`}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., What are the environmental compliance requirements for mining operations?"
                  className="w-full bg-transparent border-none outline-none text-gray-400 placeholder:text-gray-500 focus:text-white"
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button 
              type="submit"
              size="lg" 
              className="w-full md:w-auto h-16 px-8 text-lg font-semibold bg-gradient-cyan text-white hover:opacity-90 hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Querying...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Start Querying
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

