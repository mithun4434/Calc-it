

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Solution } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

export async function extractMathFromImage(imageDataUrl: string): Promise<string> {
    const [header, data] = imageDataUrl.split(',');
    if (!header || !data) throw new Error('Invalid image data URL format.');
    
    const mimeTypeMatch = header.match(/:(.*?);/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) throw new Error('Could not extract MIME type from image data URL.');
    const mimeType = mimeTypeMatch[1];
    
    const imagePart = fileToGenerativePart(data, mimeType);
    const prompt = "Extract the mathematical or physics problem from this image. Return only the extracted text, without any additional explanation or formatting.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, { text: prompt }] },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error extracting problem from image:", error);
        throw new Error("Failed to analyze the image. Please try again.");
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

const getSolvePrompt = (problem: string) => `Solve the following problem. As an AI tutor, your tone should be encouraging and helpful. Your response MUST be a single JSON object that conforms to the provided schema. Do not include any other text, explanations, or formatting outside of the JSON object. For each explanatory step in the 'steps' array, provide the corresponding mathematical calculation or equation in the 'calculationSteps' array. For example, if a step is "Subtract 5 from both sides", the calculation step could be "2x + 5 - 5 = 15 - 5".

When dealing with trigonometric functions like sin, cos, tan, be very clear about whether you are using degrees or radians. If the input is ambiguous (e.g., "sin(1)"), assume degrees but explain the difference in one of the steps, like: "It looks like you're asking for the sine of 1. Usually, this means 1 degree, which is approximately 0.017. If you meant 1 radian, the answer would be different."

**Problem to Solve:**
"${problem}"`;

export async function solveProblem(problem: string): Promise<Solution> {
    const prompt = getSolvePrompt(problem);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: solutionSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e: any) {
        console.error("Error solving problem:", e);
        throw new Error("The AI failed to solve the problem. It might be too complex or malformed.");
    }
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

// Fix: The 'matrices' parameter should accept an array of matrices (number[][][]), not just a single one (number[][]).
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
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error fetching currency exchange rate:", error);
        throw new Error("Failed to get currency conversion from AI. Please try again later.");
    }
}