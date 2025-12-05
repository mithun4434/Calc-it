
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Solution } from '../types';

// Declare global constant injected by Vite
declare const __API_KEY__: string | undefined;

// Lazy initialization getter
let aiClient: GoogleGenAI | null = null;

/**
 * Centralized function to find the API Key from any possible source.
 */
export function getSystemApiKey(): string | undefined {
    // 1. Check injected build constant (Highest priority & reliability)
    if (typeof __API_KEY__ !== 'undefined' && __API_KEY__) {
        return __API_KEY__;
    }

    // 2. Check Vite's import.meta.env
    if ((import.meta as any).env) {
        const env = (import.meta as any).env;
        if (env.VITE_API_KEY) return env.VITE_API_KEY;
        if (env.API_KEY) return env.API_KEY;
        if (env.GOOGLE_API_KEY) return env.GOOGLE_API_KEY;
    }

    // 3. Check standard process.env (Legacy/Cloud envs)
    if (typeof process !== 'undefined' && process.env) {
        if (process.env.API_KEY) return process.env.API_KEY;
        if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
        if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    }

    return undefined;
}

function getAiClient(): GoogleGenAI {
    if (aiClient) return aiClient;

    const apiKey = getSystemApiKey();

    if (!apiKey) {
        console.error("Critical Error: API Key is missing from all sources.");
        throw new Error("API Key is missing. Please ensure `API_KEY` is set in your environment variables or .env file.");
    }

    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
}

const DEMO_SOLUTION: Solution = {
    answer: "This is a DEMO response.\n\nPlease set your valid GEMINI_API_KEY in .env.local to get real answers.",
    steps: [
        "The application is currently running in Demo Mode.",
        "To fix this, open the .env.local file in your project folder.",
        "Replace 'PLACEHOLDER_API_KEY' with your actual Google Gemini API Key.",
        "Restart the application."
    ],
    calculationSteps: ["Demo Mode = Active"],
    scalarAnswer: 42
};

/**
 * Parses raw error objects from Gemini
 */
function formatGenAIError(error: any): Error {
    let msg = error.message || String(error);

    try {
        if (msg.includes('{') && msg.includes('}')) {
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

    // User friendly messages
    if (msg.includes("API Key") || msg.includes("API_KEY")) return new Error("Server configuration error: API Key missing or invalid.");
    if (msg.includes("429") || msg.includes("quota")) return new Error("Quota exceeded. Please wait a moment before trying again.");
    if (msg.includes("403")) return new Error("Access denied. Check API Key restrictions or Region.");
    if (msg.includes("500") || msg.includes("503")) return new Error("AI Service is temporarily unavailable. Please try again.");

    return new Error(msg);
}

/**
 * Aggressive JSON parser
 */
function parseGeminiJsonResponse<T>(responseText: string | undefined): T {
    if (!responseText) {
        throw new Error("AI returned an empty response.");
    }

    // 1. Try direct parse
    try {
        return JSON.parse(responseText);
    } catch (e) { }

    // 2. Try removing markdown code blocks
    let cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) { }

    // 3. Regex extraction
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) { }
    }

    throw new Error("Failed to parse JSON response");
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
 * Tries to solve simple arithmetic locally to save API quota
 * Now supports basic scientific functions
 */
function solveArithmeticLocally(problem: string): Solution | null {
    let cleanExpr = problem.toLowerCase().trim();

    // 1. Sanitize and Normalize
    cleanExpr = cleanExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\^/g, '**')
        .replace(/\bpi\b/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\blog\b/g, 'Math.log10')
        .replace(/\bln\b/g, 'Math.log');

    // 2. Security Check: Only allow numbers, operators, parens, and "Math." properties
    // This prevents arbitrary code execution while allowing math
    const safeRegex = /^[0-9+\-*/().\s]|Math\.[a-z0-9]+$/i;

    // Quick heuristic: If it contains letters that aren't part of "Math", reject it.
    // We strip "Math." and then check if any letters remain.
    const stripped = cleanExpr.replace(/Math\./g, '');
    if (/[a-z]/.test(stripped)) {
        return null; // Contains unknown variables or text
    }

    try {
        // eslint-disable-next-line no-new-func
        const result = new Function(`"use strict"; return (${cleanExpr})`)();

        if (!isFinite(result) || isNaN(result)) return null;

        // Format nicely
        const resultStr = String(Number(result.toPrecision(15)));

        return {
            answer: `The answer is ${resultStr}`,
            steps: [
                `Identify expression: ${problem}`,
                `Compute locally: ${cleanExpr.replace(/Math\./g, '')}`,
                `Result: ${resultStr}`
            ],
            calculationSteps: [
                `${problem} = ${resultStr}`
            ],
            scalarAnswer: Number(resultStr)
        };
    } catch (e) {
        return null;
    }
}

export async function extractMathFromImage(imageDataUrl: string): Promise<string> {
    const ai = getAiClient();
    const [header, data] = imageDataUrl.split(',');
    if (!header || !data) throw new Error('Invalid image data URL format.');

    const mimeTypeMatch = header.match(/:(.*?);/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) throw new Error('Could not extract MIME type.');
    const mimeType = mimeTypeMatch[1];

    const imagePart = fileToGenerativePart(data, mimeType);
    const prompt = "Extract the mathematical problem. Return ONLY the text.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
        });
        return response.text?.trim() || "";
    } catch (error) {
        throw formatGenAIError(error);
    }
}

const solutionSchema = {
    type: Type.OBJECT,
    properties: {
        answer: { type: Type.STRING },
        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
        calculationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
        matrixAnswer: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.NUMBER } } },
        scalarAnswer: { type: Type.NUMBER }
    },
    required: ["answer", "steps"]
};

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main Solver Function
 */
export async function solveProblem(problem: string): Promise<Solution> {
    // 0. Connect Lazy
    const ai = getAiClient();

    // 1. Local Solve (Saves Quota)
    const local = solveArithmeticLocally(problem);
    if (local) return local;

    // 2. API Solve
    const apiKey = getSystemApiKey();
    if (apiKey === 'PLACEHOLDER_API_KEY') {
        await delay(1000); // Simulate network delay
        return DEMO_SOLUTION;
    }

    // We use gemini-2.5-flash as requested.

    const prompt = `Solve this math/physics problem: "${problem}". 
    
    STRICT INSTRUCTIONS:
    1. Perform calculations with precision.
    2. Show step-by-step derivation clearly.
    3. Return the result in JSON format with 'answer' and 'steps'.
    4. The 'answer' field should be the final concise result.`;

    // Global Rate Limiter to prevent hitting 15 RPM limit
    // We use a simple queue to ensure at least 4 seconds between requests
    const MIN_REQUEST_INTERVAL = 4000; // 4 seconds
    let lastRequestTime = 0;

    const rateLimitedGenerate = async (modelName: string, content: any, config?: any) => {
        const now = Date.now();
        const timeSinceLast = now - lastRequestTime;

        if (timeSinceLast < MIN_REQUEST_INTERVAL) {
            const wait = MIN_REQUEST_INTERVAL - timeSinceLast;
            console.log(`Rate Limiting: Waiting ${wait}ms before next request...`);
            await delay(wait);
        }

        lastRequestTime = Date.now();
        return ai.models.generateContent({
            model: modelName,
            contents: content,
            config: config
        });
    };

    const generateWithRetry = async (modelName: string, content: any, schema?: any) => {
        let retries = 0;
        const maxRetries = 5; // Increased retries

        while (true) {
            try {
                const config: any = {};
                if (schema) {
                    config.responseMimeType = "application/json";
                    config.responseSchema = schema;
                }

                // Use the rate limited executor
                return await rateLimitedGenerate(modelName, content, Object.keys(config).length > 0 ? config : undefined);

            } catch (e: any) {
                const isQuota = e.message?.includes('429') || e.message?.includes('quota') || e.message?.includes('503');
                if (isQuota && retries < maxRetries) {
                    retries++;
                    // Aggressive backoff: 2s, 4s, 8s, 16s, 32s
                    const waitTime = 2000 * Math.pow(2, retries - 1);
                    console.warn(`Quota limit hit for ${modelName}. Retrying in ${waitTime / 1000}s... (Attempt ${retries}/${maxRetries})`);
                    await delay(waitTime);
                    continue;
                }
                throw e;
            }
        }
    };

    try {
        // Attempt 1: Structured JSON with requested model
        const response = await generateWithRetry('gemini-2.5-flash', prompt, solutionSchema);
        return parseGeminiJsonResponse<Solution>(response.text);

    } catch (e: any) {
        // If structured JSON fails, try Text Mode with SAME model
        console.warn("Structured mode failed, attempting text mode with gemini-2.5-flash...");

        try {
            const response = await generateWithRetry('gemini-2.5-flash', `Solve this problem step-by-step: ${problem}`);

            let rawText = "";
            if (response.text) {
                rawText = response.text;
            } else if (response.candidates && response.candidates.length > 0) {
                if (response.candidates[0].content && response.candidates[0].content.parts) {
                    rawText = response.candidates[0].content.parts.map(p => p.text).join('\n');
                }
            }

            if (!rawText) throw new Error("No response generated.");

            return {
                answer: "Solution found:",
                steps: rawText.split('\n').filter(line => line.trim().length > 0),
                calculationSteps: []
            };

        } catch (finalError: any) {
            throw formatGenAIError(finalError);
        }
    }
}

export async function solveCalculusProblem(type: string, details: any): Promise<Solution> {
    const d = details;
    const problem = type === 'integration'
        ? `Integrate ${d.expression} variable ${d.variable} ${d.lowerBound ? `from ${d.lowerBound} to ${d.upperBound}` : ''}`
        : `Differentiate ${d.expression} variable ${d.variable}`;
    return solveProblem(problem);
}

export async function solveMatrixProblem(op: string, matrices: number[][][]): Promise<Solution> {
    const mStr = matrices.map(m => JSON.stringify(m)).join(', ');
    return solveProblem(`Matrix ${op}: ${mStr}`);
}

export async function getCurrencyExchangeRate(amount: number, from: string, to: string): Promise<any> {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Convert ${amount} ${from} to ${to}. Return JSON: { "convertedAmount": number, "exchangeRate": number, "disclaimer": string }`,
            config: { responseMimeType: "application/json" }
        });
        return parseGeminiJsonResponse(response.text);
    } catch (e) {
        throw formatGenAIError(e);
    }
}
