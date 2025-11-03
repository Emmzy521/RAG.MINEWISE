import { Pinecone } from '@pinecone-database/pinecone';
import type { DocumentChunk } from './types';

/**
 * Pinecone vector database client for storing and retrieving document embeddings
 */
export class PineconeService {
  private client: Pinecone;
  private indexName: string;

  constructor(apiKey: string, indexName: string, environment?: string) {
    this.client = new Pinecone({
      apiKey,
      // Note: Pinecone generated SDK no longer uses environment
    });
    this.indexName = indexName;
  }

  /**
   * Get or create the index
   */
  async ensureIndex(dimension: number = 3072): Promise<void> {
    const existingIndexes = await this.client.listIndexes();
    const indexExists = existingIndexes.indexes?.some((idx) => idx.name === this.indexName);

    if (!indexExists) {
      await this.client.createIndex({
        name: this.indexName,
        dimension,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
    }
  }

  /**
   * Get the index instance
   */
  private async getIndex() {
    await this.ensureIndex();
    return this.client.index(this.indexName);
  }

  /**
   * Upsert document chunks with embeddings
   */
  async upsertChunks(
    chunks: Array<{
      chunk: DocumentChunk;
      embedding: number[];
    }>
  ): Promise<void> {
    const index = await this.getIndex();

    const vectors = chunks.map(({ chunk, embedding }) => ({
      id: chunk.id,
      values: embedding,
      metadata: {
        documentId: chunk.documentId,
        content: chunk.content,
        ...chunk.metadata,
      },
    }));

    // Pinecone supports batching up to 100 vectors at a time
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
  }

  /**
   * Delete all chunks for a document
   */
  async deleteDocumentChunks(documentId: string): Promise<void> {
    const index = await this.getIndex();
    // Delete by metadata filter
    await index.deleteMany({
      filter: {
        documentId: { $eq: documentId },
      },
    });
  }

  /**
   * Query similar chunks
   */
  async querySimilar(
    embedding: number[],
    topK: number = 5,
    filter?: Record<string, any>
  ): Promise<Array<{ chunk: DocumentChunk; score: number }>> {
    const index = await this.getIndex();

    const queryOptions: any = {
      vector: embedding,
      topK,
      includeMetadata: true,
    };

    if (filter) {
      queryOptions.filter = filter;
    }

    const results = await index.query(queryOptions);

    return (
      results.matches?.map((match) => ({
        chunk: {
          id: match.id!,
          documentId: match.metadata?.documentId as string,
          content: match.metadata?.content as string,
          metadata: {
            chunkIndex: match.metadata?.chunkIndex as number,
            ...match.metadata,
          },
        },
        score: match.score || 0,
      })) || []
    );
  }
}
