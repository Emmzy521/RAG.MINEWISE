import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Loader2 } from 'lucide-react';

interface QueryInputProps {
  onQuerySubmit: (query: string) => void | Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
}

export default function QueryInput({ 
  onQuerySubmit, 
  isLoading = false,
  placeholder = "e.g., What are the environmental compliance requirements for mining operations?"
}: QueryInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    await onQuerySubmit(query.trim());
    // Optionally clear the input after submission
    // setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-background/50 border-cyan-400/20 text-white placeholder:text-gray-500 focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400/50"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !query.trim()}
          className="bg-gradient-cyan text-white hover:opacity-90 hover:shadow-lg hover:shadow-cyan-500/50"
        >
          {isLoading ? (
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
  );
}

