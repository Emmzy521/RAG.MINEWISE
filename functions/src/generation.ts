import * as logger from 'firebase-functions/logger';

// --- Type Definitions (Define your internal data structure clearly) ---
interface RetrievedChunk {
    id: string;
    content: string;
    documentId: string;
    source: string;
    pageNumber: number;
    similarity: number;
}

// RAGResponse interface is not used in this function, but kept for clarity.
interface RAGResponse {
    answer: string;
    citations: { source: string, page: number | null, snippet: string }[];
}

/**
 * Generates a grounded response using Gemini 2.5 Pro model based on retrieved chunks.
 * This is the final Generation step of the RAG pipeline.
 * * @param query - The user's original question
 * @param retrievedChunks - Array of retrieved chunk objects containing content and source metadata
 * @returns Promise resolving to the generated response string
 */
export async function generateGroundedResponse(
    query: string,
    retrievedChunks: RetrievedChunk[]
): Promise<string> {
    try {
        // --- 1. Initialization and Configuration ---
        // Try multiple sources for project ID (Firebase Functions provides GCLOUD_PROJECT)
        const project = 
            process.env.GOOGLE_CLOUD_PROJECT_ID || 
            process.env.GCP_PROJECT_ID || 
            process.env.GCLOUD_PROJECT ||
            process.env.GOOGLE_CLOUD_PROJECT;
        const location = 'us-central1';
        const model = 'gemini-2.5-pro';
        
        if (!project) {
            logger.error('❌ Project ID not found in environment variables. Available env vars:', Object.keys(process.env).filter(k => k.includes('PROJECT')));
            throw new Error('GOOGLE_CLOUD_PROJECT_ID, GCP_PROJECT_ID, or GCLOUD_PROJECT environment variable must be set');
        }
        
        logger.log(`🔧 Using Google Cloud Project: ${project} for Gemini API`);

        // Use Vertex AI Generative AI REST API endpoint for Gemini
        // Note: Gemini models use generateContent, not predict
        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;
        
        // Get access token for authentication using firebase-admin
        const admin = await import('firebase-admin/app');
        let app;
        try {
            app = admin.getApp();
        } catch {
            app = admin.initializeApp();
        }
        
        const credential = app.options.credential;
        if (!credential) {
            throw new Error('No credential available in Firebase Admin. Ensure Firebase Admin is properly initialized.');
        }
        
        const accessTokenResult = await credential.getAccessToken();
        if (!accessTokenResult || !accessTokenResult.access_token) {
            throw new Error('Failed to obtain access token for Vertex AI');
        }
        
        const accessToken = accessTokenResult.access_token;

        // --- 2. System Instruction (The Prompt) ---
        const SYSTEM_INSTRUCTION = `You are a helpful expert assistant specializing in mining regulations and compliance in Zambia. Your role is to provide accurate, comprehensive answers based solely on the provided context documents. Follow these guidelines:
1. Your answer MUST be based ONLY on the provided context/chunks.
2. If the context does not contain enough information, explicitly state this limitation.
3. You MUST cite the source of every claim, fact, or statement using the format [Source: X], where X is the exact value of the 'source' field provided in the chunk metadata.
4. Structure your response clearly and professionally.
5. Always include a disclaimer that this is an explanation based on the provided documents, not formal legal advice, and users should consult qualified legal professionals for their specific situation.`;

        // --- 3. Construct the final prompt string ---
        let prompt = `${SYSTEM_INSTRUCTION}\n\nCONTEXT:\nThe following are relevant document chunks retrieved for answering your question:\n\n`;
        
        retrievedChunks.forEach((chunk, index) => {
            prompt += `[Chunk ${index + 1} - Source: ${chunk.source}]\n`;
            if (chunk.pageNumber) {
                prompt += `Page: ${chunk.pageNumber}\n`;
            }
            prompt += `${chunk.content}\n\n`;
        });

        prompt += `\nQUESTION:\n${query}\n\n`;
        prompt += 'Please provide a comprehensive answer based on the context above, ensuring all claims are properly cited with [Source: X] format.';

        // --- 4. Prepare the request for Gemini Generative AI API ---
        // For Gemini models, use the generateContent format
        const requestBody = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048,
                topP: 0.95,
                topK: 40,
            },
        };

        logger.log(`🚀 Calling Gemini ${model} API...`);

        // Make the API request
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Vertex AI API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json() as any;

        // --- 5. Extract and Return the Generated Text ---
        // Gemini generateContent API returns candidates directly
        if (!result.candidates || result.candidates.length === 0) {
            throw new Error('No candidates returned from the model');
        }

        const candidate = result.candidates[0];
        let finalResponse: string = '';

        // Extract text from Gemini response format
        const content = candidate?.content;
        if (content?.parts) {
            const textPart = content.parts.find((p: any) => p.text);
            if (textPart?.text) {
                finalResponse = textPart.text;
            }
        }

        if (!finalResponse) {
            // Fallback: try to extract from other possible response formats
            finalResponse = candidate?.text || String(candidate);
        }

        if (!finalResponse || finalResponse.trim().length === 0) {
            throw new Error('Model returned empty response');
        }

        logger.log(`✅ Generated response (${finalResponse.length} characters)`);
        return finalResponse;

    } catch (error: unknown) { 
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('❌ Error generating grounded response:', errorMessage);
        throw new Error(`Failed to generate response: ${errorMessage}`);
    }
}


