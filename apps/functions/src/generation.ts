import { PredictionServiceClient } from '@google-cloud/aiplatform';
// NOTE: Assuming this utility is available for conversion
import { helpers } from '@google-cloud/aiplatform'; 

// --- Type Definitions (Define your internal data structure clearly) ---
interface RetrievedChunk {
    id: string;
    content: string;
    documentId: string;
    source: string;
    pageNumber: number;
    similarity: number;
}

// Define the expected output type for a cleaner API response
interface RAGResponse {
    answer: string;
    citations: { source: string, page: number | null, snippet: string }[];
}

/**
 * Generates a grounded response using Gemini 2.5 Pro model based on retrieved chunks.
 * This is the final Generation step of the RAG pipeline.
 * @param query - The user's original question
 * @param retrievedChunks - Array of retrieved chunk objects containing content and source metadata
 * @returns Promise resolving to the generated response string
 */
export async function generateGroundedResponse(
    query: string,
    retrievedChunks: RetrievedChunk[]
): Promise<string> {
    try {
        // --- 1. Initialization and Configuration ---
        const clientOptions = {
            apiEndpoint: 'us-central1-aiplatform.googleapis.com',
        };
        const predictionServiceClient = new PredictionServiceClient(clientOptions);

        const project = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID;
        const location = 'us-central1';
        const model = 'gemini-2.5-pro';
        const publisher = 'google';
        const modelName = `projects/${project}/locations/${location}/publishers/${publisher}/models/${model}`;

        // --- 2. System Instruction (Remains Excellent) ---
        const SYSTEM_INSTRUCTION = `You are a helpful expert assistant specializing in mining regulations and compliance in Zambia. Your role is to provide accurate, comprehensive answers based solely on the provided context documents. Follow these guidelines:
1. Your answer MUST be based ONLY on the provided context/chunks.
2. If the context does not contain enough information, explicitly state this limitation.
3. You MUST cite the source of every claim, fact, or statement using the format [Source: X], where X is the exact value of the 'source' field provided in the chunk metadata.
4. Structure your response clearly and professionally.
5. Always include a disclaimer that this is an explanation based on the provided documents, not formal legal advice, and users should consult qualified legal professionals for their specific situation.`;

        // --- 3. Construct the final prompt string ---
        let prompt = `${SYSTEM_INSTRUCTION}\n\nCONTEXT:\nThe following are relevant document chunks retrieved for answering your question:\n\n`;
        
        // Build the context string
        retrievedChunks.forEach((chunk, index) => {
            prompt += `[Chunk ${index + 1} - Source: ${chunk.source}]\n`;
            if (chunk.pageNumber) {
                prompt += `Page: ${chunk.pageNumber}\n`;
            }
            prompt += `${chunk.content}\n\n`;
        });

        prompt += `\nQUESTION:\n${query}\n\n`;
        prompt += 'Please provide a comprehensive answer based on the context above, ensuring all claims are properly cited with [Source: X] format.';

        // --- 4. Prepare the prediction request for Gemini model ---
        const parameter = {
            temperature: 0.2,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40,
        };

        // The request structure for the Gemini API
        const request = {
            endpoint: modelName,
            // instances now correctly includes the 'contents' array directly inside the protoValue conversion
            instances: helpers.toValue([
                {
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }],
                        },
                    ],
                },
            ]) as any[], 
            parameters: helpers.toValue(parameter) as any,
        };
        
        // --- FIX for TS2345: The Vertex SDK has version conflicts with internal types ---
        // We use a safe type assertion on the request and response objects since the internal 
        // SDK types are complex and often mismatched across dependency updates.
        const [response] = await predictionServiceClient.predict(request as any);

        // --- 5. Extract and Return the Generated Text ---
        if (!response.predictions || response.predictions.length === 0) {
            throw new Error('No predictions returned from the model');
        }

        // Parse the prediction response using helpers.fromValue
        const prediction = helpers.fromValue(response.predictions[0]);

        let finalResponse: string = '';

        // Safely extract the generated text from the complex Gemini proto structure
        const candidates = (prediction as any)?.candidates;
        if (candidates && candidates.length > 0) {
             const textPart = candidates[0]?.content?.parts?.find((p: any) => p.text)?.text;
             if (textPart) {
                 finalResponse = textPart;
             }
        }
        
        if (!finalResponse) {
             // Fallback for unexpected or legacy structures
             finalResponse = (prediction as any).text || (prediction as any).generated_text || String(prediction);
        }

        // Validate final response
        if (finalResponse.trim().length === 0) {
             throw new Error('Model returned empty response');
        }

        console.log(`✅ Generated response (${finalResponse.length} characters)`);
        return finalResponse;

    } catch (error: any) {
        // --- FIX for TS18046: Use 'instanceof Error' or type assertion to fix 'unknown' type ---
        console.error('❌ Error generating grounded response:', error.message || error);
        throw new Error(`Failed to generate response: ${error.message || String(error)}`);
    }
}