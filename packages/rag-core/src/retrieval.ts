import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';
import type { RetrievalResult, QueryResponse } from './types';

/**
 * RAG retrieval and generation service
 */
export class RAGService {
  private llm: ChatOpenAI;
  private defaultSystemPrompt: string;

  constructor(apiKey: string, modelName: string = 'gpt-4') {
    this.llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName,
      temperature: 0.2, // Lower temperature for more factual responses
    });

    this.defaultSystemPrompt = `You are a helpful legal assistant specializing in mining regulations and compliance in Zambia. 
Use the provided context documents to answer questions accurately. Always cite specific sources when referencing legal information.

If the context does not contain enough information to answer the question, say so explicitly.
Never make up legal information or provide advice beyond what is in the context.

IMPORTANT: Always include a disclaimer that this is an explanation based on the provided documents, not formal legal advice, and users should consult with qualified legal professionals for their specific situation.`;
  }

  /**
   * Generate answer from query and retrieved chunks
   */
  async generateAnswer(
    query: string,
    retrievedChunks: RetrievalResult[],
    systemPrompt?: string
  ): Promise<QueryResponse> {
    // Format context from retrieved chunks
    const context = retrievedChunks
      .map(
        (result, idx) =>
          `[Source ${idx + 1} - Document: ${result.chunk.documentId}, Chunk: ${result.chunk.id}]\n${result.chunk.content}\n`
      )
      .join('\n---\n\n');

    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(
        systemPrompt || this.defaultSystemPrompt
      ),
      HumanMessagePromptTemplate.fromTemplate(`Context documents:
{context}

Question: {question}

Please provide a comprehensive answer based on the context above. Include citations to specific sources (e.g., [Source 1], [Source 2]).`),
    ]);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    const answer = await chain.invoke({
      context,
      question: query,
    });

    // Format sources
    const sources = retrievedChunks.map((result) => ({
      documentId: result.chunk.documentId,
      chunkId: result.chunk.id,
      content: result.chunk.content.substring(0, 500) + '...', // Truncate for display
      score: result.score,
    }));

    return {
      answer,
      sources,
    };
  }

  /**
   * Generate answer with custom system prompt
   */
  async generateWithCustomPrompt(
    query: string,
    retrievedChunks: RetrievalResult[],
    customPrompt: string
  ): Promise<QueryResponse> {
    return this.generateAnswer(query, retrievedChunks, customPrompt);
  }
}