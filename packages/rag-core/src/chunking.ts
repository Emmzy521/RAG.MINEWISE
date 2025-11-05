import { RecursiveCharacterTextSplitter, TextSplitter } from '@langchain/textsplitters';
import type { DocumentChunk } from './types';

/**
 * Chunk text documents into smaller semantic pieces
 */
export class DocumentChunker {
  private splitter: TextSplitter;

  constructor(
    chunkSize: number = 1000,
    chunkOverlap: number = 200
  ) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });
  }

  /**
   * Split text into chunks
   */
  async chunkText(
    text: string,
    documentId: string,
    metadata: Record<string, any> = {}
  ): Promise<DocumentChunk[]> {
    const chunks = await this.splitter.splitText(text);
    
    return chunks.map((content: string, index: number) => ({
      id: `${documentId}-chunk-${index}`,
      documentId,
      content,
      metadata: {
        chunkIndex: index,
        ...metadata,
      },
    }));
  }

  /**
   * Chunk with additional metadata tracking
   */
  async chunkWithMetadata(
    text: string,
    documentId: string,
    options: {
      pageNumber?: number;
      startCharIndex?: number;
    } = {}
  ): Promise<DocumentChunk[]> {
    const chunks = await this.chunkText(text, documentId, {
      pageNumber: options.pageNumber,
    });

    // Calculate character indices if start is provided
    if (options.startCharIndex !== undefined) {
      let currentIndex = options.startCharIndex;
      return chunks.map((chunk) => {
        const startCharIndex = currentIndex;
        currentIndex += chunk.content.length;
        return {
          ...chunk,
          metadata: {
            ...chunk.metadata,
            startCharIndex,
            endCharIndex: currentIndex - 1,
          },
        };
      });
    }

    return chunks;
  }
}


