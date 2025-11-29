
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Solution } from '../types';

// Lazy initialization getter
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
    if (aiClient) return aiClient;
    
    // We check for the key at runtime, not load time.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing. Please check your deployment settings (process.env.API_KEY).");
    }
    
    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
}

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
    if (msg.includes("API Key")) return new Error("Server configuration error: API Key missing.");
    if (msg.includes("429")) return new Error("Server is busy (High Traffic). Please try again in 5 seconds.");
    if (msg.includes("403")) return new Error("Access denied. Check API Key restrictions.");

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
    } catch (e) {}

    // 2. Try removing markdown code blocks
    let cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {}

    // 3. Regex extraction
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {}
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
 * Tries to solve simple arithmetic locally
 */
function solveArithmeticLocally(problem: string): Solution | null {
    const cleanExpr = problem.trim();
    const mathRegex = /^[0-9+\-*/().\s^]+$/;

    if (!mathRegex.test(cleanExpr)) {
        return null;
    }

    try {
        const jsExpr = cleanExpr.replace(/\^/g, '**');
        // eslint-disable-next-line no-new-func
        const result = new Function(`"use strict"; return (${jsExpr})`)();

        if (!isFinite(result) || isNaN(result)) return null;

        const resultStr = String(Number(result.toPrecision(15)));

        return {
            answer: `The answer is ${resultStr}`,
            steps: [
                `Calculated: ${cleanExpr}`,
            ],
            calculationSteps: [
                `${cleanExpr} = ${resultStr}`
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
        // Try fast model first for vision
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
        });
        return response.text?.trim() || "";
    } catch (error) {
        // Fallback to Pro
        try {
             const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: { parts: [imagePart, { text: prompt }] },
            });
            return response.text?.trim() || "";
        } catch(e) {
            throw new Error("Could not read image. Please type the problem.");
        }
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

/**
 * Main Solver Function
 */
export async function solveProblem(problem: string): Promise<Solution> {
    // 0. Connect Lazy
    const ai = getAiClient();

    // 1. Local Solve
    const local = solveArithmeticLocally(problem);
    if (local) return local;

    // 2. Structured Solve
    // Priority: Pro (Precision/Reasoning) -> Flash (Speed/Fallback)
    // We prioritize gemini-3-pro-preview for highest mathematical accuracy
    const models = ['gemini-3-pro-preview', 'gemini-2.5-flash'];
    
    const prompt = `Solve this math/physics problem: "${problem}". 
    
    STRICT INSTRUCTIONS FOR PRECISION:
    1. Perform calculations with maximum precision.
    2. If the result involves irrational numbers (like π, √2, e), keep them in exact form AND provide a high-precision decimal approximation if applicable.
    3. Show step-by-step derivation clearly.
    4. Return the result in JSON format with 'answer' and 'steps'.
    5. The 'answer' field should be the final concise result.`;

    for (const model of models) {
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: solutionSchema,
                },
            });
            return parseGeminiJsonResponse<Solution>(response.text);
        } catch (e) {
            console.warn(`Structured solve failed on ${model}. Trying next.`);
            continue; 
        }
    }

    // 3. TEXT FALLBACK (The "Just give me anything" Option)
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Solve this problem step-by-step with high precision: ${problem}`,
        });
        
        let rawText = "";
        
        // Robust text extraction
        if (response.text) {
            rawText = response.text;
        } else if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
             // Check if blocked by safety
            if (candidate.finishReason === 'SAFETY') {
                 throw new Error("I cannot solve this problem because it triggers safety filters.");
            }
            if (candidate.finishReason === 'RECITATION') {
                 throw new Error("I cannot solve this problem due to copyright/recitation limits.");
            }
             // Try to dig out parts
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                rawText = candidate.content.parts.map(p => p.text).join('\n');
            }
        }

        if (!rawText) {
             throw new Error("No response content generated.");
        }
        
        return {
            answer: "Here is the solution:",
            steps: rawText.split('\n').filter(line => line.trim().length > 0),
            calculationSteps: []
        };
    } catch (finalError: any) {
        // Throw a formatted error that the UI can display nicely
        throw formatGenAIError(finalError);
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
