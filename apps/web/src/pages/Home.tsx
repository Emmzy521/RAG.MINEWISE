import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Search, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-200px)] flex flex-col items-center justify-center">
      {/* Radial gradient background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] radial-glow opacity-50"></div>
      </div>

      {/* Main centered content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 space-y-12">
        {/* Central Prompt Area with Glow */}
        <div className="relative">
          <div className="absolute inset-0 radial-glow opacity-30"></div>
          <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-8 glow-border border-cyan-400/30">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-3 text-cyan-400 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">Ask anything about mining regulations</span>
                </div>
                <Link to="/query" className="block">
                  <div className="w-full h-16 bg-background/50 border border-cyan-400/20 rounded-lg flex items-center px-4 text-gray-400 hover:glow-border-focus hover:border-cyan-400/50 transition-all cursor-pointer">
                    <span>e.g., What are the environmental compliance requirements for mining operations?</span>
                  </div>
                </Link>
              </div>
              <Link to="/query" className="w-full md:w-auto">
                <Button size="lg" className="w-full md:w-auto h-16 px-8 text-lg font-semibold">
                  <Search className="w-5 h-5 mr-2" />
                  Start Querying
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
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
      </div>
    </div>
  );
}
