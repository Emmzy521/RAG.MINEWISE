export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: {
    chunkIndex: number;
    startCharIndex?: number;
    endCharIndex?: number;
    pageNumber?: number;
  };
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  uploadedAt: Date;
  userId: string;
  size: number;
  mimeType: string;
  chunkCount?: number;
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  score: number;
}

export interface QueryResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    chunkId: string;
    content: string;
    score: number;
  }>;
}


