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

/**
 * Formats a response string to be user-friendly and publication-ready.
 * - Ensures friendly introduction
 * - Adds emojis to section headers
 * - Removes technical references
 * - Adds clean sources footer
 */
function formatUserFriendlyResponse(
    response: string,
    chunks: RetrievedChunk[]
): string {
    let formatted = response.trim();

    // Remove any technical metadata mentions
    formatted = formatted
        .replace(/\[Chunk \d+\]/gi, '')
        .replace(/similarity[:\s]*[\d.]+/gi, '')
        .replace(/chunk[s]?/gi, '')
        .replace(/vector[s]?/gi, '')
        .replace(/embedding[s]?/gi, '');

    // Ensure response starts with a friendly introduction if it doesn't already
    const friendlyStarters = [
        /^(here'?s|sure|great|absolutely|of course|certainly)/i,
        /^(let me|i'll|i can)/i,
    ];
    const hasFriendlyStart = friendlyStarters.some(pattern => pattern.test(formatted));
    
    if (!hasFriendlyStart && !formatted.match(/^#/)) {
        // Add a friendly introduction if the response doesn't start with one
        formatted = `Here's what I found about your question:\n\n${formatted}`;
    }

    // Add emojis to markdown headers (###) for visual appeal
    const emojiMap: { [key: string]: string } = {
        'regulation': '⚖️',
        'policy': '📘',
        'requirement': '📋',
        'process': '🔄',
        'permit': '📄',
        'license': '📜',
        'mining': '⛏️',
        'mineral': '🪙',
        'resource': '💎',
        'compliance': '✅',
        'summary': '📝',
        'overview': '👁️',
        'key': '🔑',
        'important': '⚠️',
        'note': '📌',
    };

    // Add emojis to headers based on keywords
    formatted = formatted.replace(/^(###?)\s+(.+)$/gm, (match, hashes, title) => {
        const lowerTitle = title.toLowerCase();
        for (const [keyword, emoji] of Object.entries(emojiMap)) {
            if (lowerTitle.includes(keyword)) {
                return `${hashes} ${emoji} ${title}`;
            }
        }
        return match; // Keep original if no match
    });

    // Extract and format clean source names
    const uniqueSources = Array.from(new Set(chunks.map(c => c.source)))
        .map(source => cleanSourceName(source))
        .filter((name): name is string => name !== null && name.length > 0);

    // Add clean sources footer if sources exist
    if (uniqueSources.length > 0) {
        const sourcesText = uniqueSources.length === 1
            ? `**Source:** ${uniqueSources[0]}`
            : `**Sources:**\n${uniqueSources.map(s => `- ${s}`).join('\n')}`;
        
        formatted = `${formatted}\n\n---\n\n${sourcesText}`;
    }

    return formatted.trim();
}

/**
 * Cleans a source name by removing file paths, extensions, and technical prefixes.
 */
function cleanSourceName(source: string): string | null {
    if (!source) return null;

    // Remove gs:// bucket paths
    let cleaned = source.replace(/^gs:\/\/[^\/]+\//, '');
    
    // Remove .pdf, .docx, etc. extensions
    cleaned = cleaned.replace(/\.(pdf|docx?|txt|md)$/i, '');
    
    // Remove common path prefixes
    cleaned = cleaned.replace(/^(\.\/|\.\.\/|\/)/, '');
    
    // Extract just the filename if it's a path
    const parts = cleaned.split('/');
    cleaned = parts[parts.length - 1];
    
    // Clean up underscores and hyphens, make it title case
    cleaned = cleaned
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Convert to title case (simple version)
    cleaned = cleaned.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return cleaned || null;
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

        // --- 2. Prepare documents for the prompt ---
        // Map chunks to docs format, extracting just the text content
        const docs = retrievedChunks.map((chunk) => ({
            text: chunk.content,
            source: chunk.source,
            pageNumber: chunk.pageNumber,
        }));

        // --- 3. Construct the conversational prompt ---
        const userPrompt = `
You are **MineWise Assistant**, a knowledgeable and friendly AI specializing in mining and resource policy.

Your goals:
- Write in a clear, conversational tone.
- Use short sections and bullet points for readability.
- Refer to sources as "Source Document" instead of showing file paths.
- End with a brief summary of the main insights.
- Never mention technical processing details like 'chunks' or 'similarity'.

Now, answer the user's question using only the context below.

**Question:**
${query}

**Relevant Documents:**
${docs.map(d => d.text).join("\n\n")}
`;

        // --- 4. Prepare the request for Gemini Generative AI API ---
        // For Gemini models, use the generateContent format
        const requestBody = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: userPrompt }],
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

        // --- 6. Post-process the response for user-friendly formatting ---
        const formattedResponse = formatUserFriendlyResponse(finalResponse, retrievedChunks);

        logger.log(`✅ Generated response (${formattedResponse.length} characters)`);
        return formattedResponse;

    } catch (error: unknown) { 
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('❌ Error generating grounded response:', errorMessage);
        throw new Error(`Failed to generate response: ${errorMessage}`);
    }
}


