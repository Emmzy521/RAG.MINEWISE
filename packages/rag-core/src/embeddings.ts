import { OpenAIEmbeddings } from '@langchain/openai';
import type { DocumentChunk } from './types';

/**
 * Generate embeddings for text chunks using OpenAI
 */
export class EmbeddingService {
  private embeddings: OpenAIEmbeddings;

  constructor(apiKey: string) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: 'text-embedding-3-large',
      dimensions: 3072, // text-embedding-3-large dimensions
    });
  }

  /**
   * Generate embedding for a single text
   */
  async embedText(text: string): Promise<number[]> {
    const result = await this.embeddings.embedQuery(text);
    return result;
  }

  /**
   * Generate embeddings for multiple chunks
   */
  async embedChunks(chunks: DocumentChunk[]): Promise<Array<{ chunk: DocumentChunk; embedding: number[] }>> {
    const texts = chunks.map((chunk) => chunk.content);
    const embeddings = await this.embeddings.embedDocuments(texts);

    return chunks.map((chunk, index) => ({
      chunk,
      embedding: embeddings[index],
    }));
  }
}


