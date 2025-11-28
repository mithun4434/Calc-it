
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Solution } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Parses raw error objects from Gemini which might be JSON strings
 * and returns a clean, user-friendly Error object.
 */
function formatGenAIError(error: any): Error {
    let msg = error.message || String(error);
    
    // Check if the message itself is a JSON string (common with 429/400 errors)
    try {
        if (msg.includes('{') && msg.includes('}')) {
             // Extract JSON part if mixed with text
             const match = msg.match(/(\{.*\})/);
             if (match) {
                 const parsed = JSON.parse(match[1]);
                 if (parsed.error && parsed.error.message) {
                     msg = parsed.error.message;
                 } else if (parsed.message) {
                     msg = parsed.message;
                 }
             }
        }
    } catch (e) {
        // Failed to parse, use original message
    }

    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        return new Error("Service is currently busy (Quota Exceeded). Switched to backup model.");
    }

    return new Error(msg);
}

/**
 * Safely parses a JSON string from a Gemini response.
 * Uses multiple strategies to extract valid JSON from potential markdown or chatter.
 */
function parseGeminiJsonResponse<T>(responseText: string | undefined): T {
    if (!responseText) {
        throw new Error("AI returned an empty response.");
    }

    // Strategy 1: Attempt direct parse
    try {
        return JSON.parse(responseText);
    } catch (e) {
        // Continue to next strategy
    }

    // Strategy 2: Clean markdown code fences
    let cleanText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        // Continue
    }

    // Strategy 3: Find the first '{' and last '}' to isolate the JSON object
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end > start) {
        const jsonSubstring = responseText.substring(start, end + 1);
        try {
            return JSON.parse(jsonSubstring);
        } catch (e) {
            console.error("Strategy 3 Parsing Failed:", jsonSubstring);
        }
    }

    console.error("All JSON parsing strategies failed. Raw text:", responseText);
    throw new Error("The AI provided a solution, but it was not in the expected format.");
}

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

/**
 * Helper function to retry an async operation with exponential backoff.
 */
async function withRetry<T>(
    operation: () => Promise<T>,
    retries: number = 2,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            // Only retry on rate limits (429) or server errors (5xx)
            const msg = (error.message || JSON.stringify(error)).toLowerCase();
            const isTransient = msg.includes('429') || msg.includes('quota') || msg.includes('503') || msg.includes('overloaded');
            
            if (isTransient && i < retries - 1) {
                const delay = baseDelay * Math.pow(2, i);
                // console.warn(`Transient error. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

export async function extractMathFromImage(imageDataUrl: string): Promise<string> {
    const [header, data] = imageDataUrl.split(',');
    if (!header || !data) throw new Error('Invalid image data URL format.');
    
    const mimeTypeMatch = header.match(/:(.*?);/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) throw new Error('Could not extract MIME type from image data URL.');
    const mimeType = mimeTypeMatch[1];
    
    const imagePart = fileToGenerativePart(data, mimeType);
    const prompt = "Extract the mathematical or physics problem from this image. Return only the extracted text, without any additional explanation or formatting.";

    // Try Gemini 3 Pro first for best vision recognition, fallback to Flash
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [imagePart, { text: prompt }] },
        });
        return response.text?.trim() || "";
    } catch (error: any) {
        console.warn("Pro extraction failed, falling back to Flash:", error);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, { text: prompt }] },
            });
            return response.text?.trim() || "";
        } catch (fallbackError) {
             throw formatGenAIError(fallbackError);
        }
    }
}

const solutionSchema = {
    type: Type.OBJECT,
    properties: {
        answer: { type: Type.STRING, description: "The final answer to the problem, expressed in a complete sentence." },
        steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of strings, where each string is a step-by-step explanation for solving the problem."
        },
        calculationSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of strings, where each string is the mathematical expression, equation, or calculation corresponding to a step in the solution. This should be parallel to the 'steps' array."
        },
        matrixAnswer: {
            type: Type.ARRAY,
            description: "If the answer is a matrix, this is the 2D array representation. Optional.",
            items: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
            }
        },
        scalarAnswer: {
            type: Type.NUMBER,
            description: "If the answer is a single number, this is the numerical value. Optional."
        }
    },
    required: ["answer", "steps"]
};

const getSolvePrompt = (problem: string) => `Solve the following problem. As an AI tutor, your tone should be encouraging and helpful. Your response MUST be a single JSON object that conforms to the provided schema. Do NOT include any markdown formatting, 'json' tags, or preamble. Just the raw JSON object.

For each explanatory step in the 'steps' array, provide the corresponding mathematical calculation or equation in the 'calculationSteps' array.

**Problem to Solve:**
"${problem}"`;

export async function solveProblem(problem: string): Promise<Solution> {
    const prompt = getSolvePrompt(problem);
    
    // 1. Try gemini-3-pro-preview (Best quality)
    // 2. Try gemini-2.5-flash (Best speed/reliability fallback)
    // 3. Try gemini-flash-lite-latest (Ultimate backup)
    const models = ['gemini-3-pro-preview', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];
    let lastError: any;

    const attemptSolve = async (model: string) => {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: solutionSchema,
            },
        });
        return parseGeminiJsonResponse<Solution>(response.text);
    };

    for (const model of models) {
        try {
            // We retry the model itself once if it fails, then move to the next model in the list
            return await withRetry(() => attemptSolve(model), 2, 1000);
        } catch (e: any) {
            console.warn(`Model ${model} failed. Trying next model...`, e);
            lastError = e;
            // Continue to the next model in the list
        }
    }

    // If all models failed, we throw a formatted error
    throw formatGenAIError(lastError);
}


export async function solveCalculusProblem(
    type: 'integration' | 'differentiation',
    problemDetails: {
        expression: string;
        variable: string;
        lowerBound?: string;
        upperBound?: string;
    }
): Promise<Solution> {
    let problemStatement = '';
    if (type === 'integration') {
        if (problemDetails.lowerBound && problemDetails.upperBound && problemDetails.lowerBound.trim() !== '' && problemDetails.upperBound.trim() !== '') {
            problemStatement = `Calculate the definite integral of ${problemDetails.expression} with respect to ${problemDetails.variable} from ${problemDetails.lowerBound} to ${problemDetails.upperBound}.`;
        } else {
            problemStatement = `Calculate the indefinite integral of ${problemDetails.expression} with respect to ${problemDetails.variable}. Provide the constant of integration as '+ C'.`;
        }
    } else { // differentiation
        problemStatement = `Differentiate the expression ${problemDetails.expression} with respect to ${problemDetails.variable}.`;
    }

    return solveProblem(problemStatement);
}

export async function solveMatrixProblem(
    operation: string,
    matrices: number[][][]
): Promise<Solution> {
    let problemStatement = `As an AI tutor, please calculate the ${operation} for the given matrix/matrices and provide a friendly, step-by-step explanation.\n\n`;

    matrices.forEach((matrix, index) => {
        const matrixName = String.fromCharCode(65 + index); // A, B, C...
        problemStatement += `Matrix ${matrixName}:\n${JSON.stringify(matrix)}\n\n`;
    });

    return solveProblem(problemStatement);
}


export async function getCurrencyExchangeRate(amount: number, from: string, to: string): Promise<{ convertedAmount: number, exchangeRate: number, disclaimer:string }> {
     const schema = {
        type: Type.OBJECT,
        properties: {
            convertedAmount: {
                type: Type.NUMBER,
                description: 'The final converted amount.',
            },
            exchangeRate: {
                type: Type.NUMBER,
                description: 'The exchange rate used for the conversion (1 FROM = X TO).',
            },
            disclaimer: {
                type: Type.STRING,
                description: 'A brief disclaimer that rates are approximate and based on latest available data.',
            },
        },
        required: ['convertedAmount', 'exchangeRate', 'disclaimer'],
    };

    const prompt = `Based on the latest available data, what is the exchange rate to convert ${amount} ${from} to ${to}? Provide the converted amount, the exchange rate, and a brief disclaimer.`;

    try {
        // Use Flash for currency as it's faster and data is sufficient
        return await withRetry(async () => {
             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });
            return parseGeminiJsonResponse<{ convertedAmount: number, exchangeRate: number, disclaimer:string }>(response.text);
        });
    } catch (error: any) {
        console.error("Error fetching currency exchange rate:", error);
        throw formatGenAIError(error);
    }
}
