import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../lib/api';
import { FileText, Search, Database, Loader2 } from 'lucide-react';

interface DashboardStats {
  documentCount: number;
  queryCount: number;
  totalChunks: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-300 mt-2">View analytics and system statistics</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-cyan-400/20 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Documents</CardTitle>
            <FileText className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.documentCount || 0}</div>
            <p className="text-xs text-gray-400">Total uploaded documents</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-cyan-400/20 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Queries</CardTitle>
            <Search className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.queryCount || 0}</div>
            <p className="text-xs text-gray-400">Total queries executed</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-cyan-400/20 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Chunks</CardTitle>
            <Database className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.totalChunks || 0}</div>
            <p className="text-xs text-gray-400">Total indexed chunks</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
