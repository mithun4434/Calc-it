
import { GoogleGenAI, Type } from "@google/genai";
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
    const prompt = "Extract the mathematical equation or problem from this image. Return only the extracted text, without any additional explanation or formatting.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error extracting math from image:", error);
        throw new Error("Failed to analyze the image. Please try again.");
    }
}

const solveMathProblemSchema = {
    type: Type.OBJECT,
    properties: {
        answer: {
            type: Type.STRING,
            description: 'The final numerical or symbolic answer to the math problem.',
        },
        steps: {
            type: Type.ARRAY,
            description: 'An array of strings, where each string is a step-by-step explanation of the solution process.',
            items: {
                type: Type.STRING,
            },
        },
    },
    required: ['answer', 'steps'],
};


export async function solveMathProblem(problem: string): Promise<Solution> {
    const prompt = `Solve the following math problem and provide the answer and a step-by-step solution. Problem: "${problem}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: solveMathProblemSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedSolution = JSON.parse(jsonText);

        // Basic validation
        if (parsedSolution && typeof parsedSolution.answer === 'string' && Array.isArray(parsedSolution.steps)) {
            return parsedSolution as Solution;
        } else {
             throw new Error("AI response was not in the expected format.");
        }

    } catch (error) {
        console.error("Error solving math problem:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse the AI's solution. The model may have returned an invalid format.");
        }
        throw new Error("The AI failed to solve the problem. It might be too complex or malformed.");
    }
}
