import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Search, Upload, FileText } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Minewise AI</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your intelligent assistant for finding accurate, up-to-date legal information related to
          mining regulations and compliance in Zambia.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Upload className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Upload mining-related legal PDFs or text documents for indexing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/upload">
              <Button className="w-full">Upload Documents</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Search className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Ask Questions</CardTitle>
            <CardDescription>
              Query your documents using natural language and get AI-powered answers with
              citations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/query">
              <Button className="w-full">Start Querying</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <FileText className="w-8 h-8 text-primary mb-2" />
            <CardTitle>View Analytics</CardTitle>
            <CardDescription>
              Monitor your document statistics, query logs, and system usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard">
              <Button className="w-full">View Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Legal Disclaimer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Minewise AI provides explanations based on uploaded documents and is not a substitute
            for professional legal advice. All responses are informational and should not be
            construed as formal legal advice. Please consult with qualified legal professionals for
            your specific situation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
