import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { api } from '../lib/api';
import { Upload as UploadIcon, FileText, X } from 'lucide-react';

interface Document {
  id: string;
  filename: string;
  uploadedAt: any;
  size: number;
  chunkCount?: number;
}

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs as Document[]);
    } catch (error: any) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          // For PDFs, read as base64
          const reader2 = new FileReader();
          reader2.onload = (e2) => {
            const base64 = (e2.target?.result as string).split(',')[1];
            resolve(base64);
          };
          reader2.onerror = reject;
          reader2.readAsDataURL(file);
        } else {
          resolve(e.target?.result as string);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const content = await readFileAsText(file);
        await api.uploadDocument({
          filename: file.name,
          content,
          mimeType: file.type || 'text/plain',
        });
      }
      setFiles([]);
      await loadDocuments();
      alert('Documents uploaded successfully!');
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.deleteDocument({ documentId });
      await loadDocuments();
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  if (loading) {
    return <div>Loading documents...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upload Documents</h1>
        <p className="text-muted-foreground mt-2">
          Upload mining-related legal documents for indexing and searching
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Documents</CardTitle>
          <CardDescription>
            Supported formats: PDF, TXT, DOCX. Documents will be processed and indexed automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.txt,.docx,.doc"
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected files:</p>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
            <UploadIcon className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>Manage your uploaded documents</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{doc.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.chunkCount || 0} chunks •{' '}
                          {new Date(doc.uploadedAt?.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(doc.id)}>
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
