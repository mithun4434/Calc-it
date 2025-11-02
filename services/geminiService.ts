
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
    const prompt = "Extract the mathematical or physics problem from this image. Return only the extracted text, without any additional explanation or formatting.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error extracting problem from image:", error);
        throw new Error("Failed to analyze the image. Please try again.");
    }
}

const solveProblemSchema = {
    type: Type.OBJECT,
    properties: {
        answer: {
            type: Type.STRING,
            description: 'The final answer to the problem, presented in a full, human-readable sentence. If the answer is a matrix, this should be a descriptive sentence like "The resulting matrix is:". The matrix data should be in the `matrixAnswer` field.',
        },
        steps: {
            type: Type.ARRAY,
            description: 'An array of strings that breaks down the solution into simple, easy-to-follow steps. Each string should be a single step explained in a friendly, encouraging tone for a student. For example: ["Great start! First, we need to add 5 to both sides of the equation."]',
            items: {
                type: Type.STRING,
            },
        },
        matrixAnswer: {
            type: Type.ARRAY,
            description: "Optional. If the final answer is a matrix, provide it here as a 2D array of numbers, e.g., [[1, 2], [3, 4]]. Leave this field out if the answer is not a matrix.",
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.NUMBER,
                }
            }
        },
    },
    required: ['answer', 'steps'],
};


export async function solveProblem(problem: string): Promise<Solution> {
    const prompt = `As an AI tutor for students, your goal is to make learning engaging and clear. Your tone should be encouraging and helpful.
Solve the following problem.
First, provide the final answer as a complete, human-readable sentence.
Then, provide a step-by-step breakdown. Each step should be a simple sentence explaining the logic, as if you're guiding a student who is learning this for the first time.

IMPORTANT: If the final answer is a matrix, provide a descriptive sentence in the 'answer' field (e.g., 'The resulting matrix is:') and provide the matrix as a 2D array of numbers in the 'matrixAnswer' field. For all other types of answers, do not include the 'matrixAnswer' field.

When dealing with trigonometric functions like sin, cos, tan, be very clear about whether you are using degrees or radians, as this is a common point of confusion for students. If the input is ambiguous (e.g., "sin(1)"), it's best to assume they mean degrees unless "radians" is specified. However, you should still explain the difference. For instance, when solving "sin(1)", you could clarify: "It looks like you're asking for the sine of 1. Usually, in introductory math, this means 1 degree. The sine of 1 degree is a very small number, but not quite zero! It's approximately 0.017. If you meant 1 radian, the answer would be different."

Problem: "${problem}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: solveProblemSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedSolution = JSON.parse(jsonText);

        // Basic validation
        if (parsedSolution && typeof parsedSolution.answer === 'string' && Array.isArray(parsedSolution.steps)) {
            // Optional matrix validation
            if (parsedSolution.matrixAnswer !== undefined) {
                if (
                    !Array.isArray(parsedSolution.matrixAnswer) ||
                    !parsedSolution.matrixAnswer.every((row: any) => 
                        Array.isArray(row) && row.every((cell: any) => typeof cell === 'number')
                    )
                ) {
                    throw new Error("AI response contained an invalid matrix format.");
                }
            }
            return parsedSolution as Solution;
        } else {
             throw new Error("AI response was not in the expected format.");
        }

    } catch (error) {
        console.error("Error solving problem:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse the AI's solution. The model may have returned an invalid format.");
        }
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

const solveMatrixProblemSchema = {
    type: Type.OBJECT,
    properties: {
        answer: {
            type: Type.STRING,
            description: 'A human-readable sentence describing the result of the matrix operation. E.g., "The determinant of the matrix is 7." or "The resulting matrix from the transpose is:".',
        },
        steps: {
            type: Type.ARRAY,
            description: 'An array of strings that breaks down the solution into simple, easy-to-follow steps.',
            items: {
                type: Type.STRING,
            },
        },
        matrixAnswer: {
            type: Type.ARRAY,
            description: "Optional. The resulting matrix for operations like transpose, inverse, addition, etc. Provide as a 2D array of numbers.",
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.NUMBER,
                }
            }
        },
        scalarAnswer: {
            type: Type.NUMBER,
            description: "Optional. The resulting single number for operations like determinant."
        }
    },
    required: ['answer', 'steps'],
};

export async function solveMatrixProblem(
    operation: string,
    matrices: number[][],
): Promise<Solution> {
    let problemStatement = `As an AI tutor, please calculate the ${operation} for the given matrix/matrices and provide a friendly, step-by-step explanation.\n\n`;

    matrices.forEach((matrix, index) => {
        const matrixName = String.fromCharCode(65 + index); // A, B, C...
        problemStatement += `Matrix ${matrixName}:\n${JSON.stringify(matrix)}\n\n`;
    });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: problemStatement,
            config: {
                responseMimeType: "application/json",
                responseSchema: solveMatrixProblemSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedSolution = JSON.parse(jsonText);

        if (parsedSolution && typeof parsedSolution.answer === 'string' && Array.isArray(parsedSolution.steps)) {
            return parsedSolution as Solution;
        } else {
            throw new Error("AI response was not in the expected format.");
        }

    } catch (error) {
        console.error("Error solving matrix problem:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse the AI's solution. The model may have returned an invalid format.");
        }
        throw new Error("The AI failed to solve the matrix problem. The matrices might be invalid for this operation.");
    }
}

export async function getCurrencyExchangeRate(amount: number, from: string, to: string): Promise<{ convertedAmount: number, exchangeRate: number, disclaimer: string }> {
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
            model: 'gemini-2.5-pro',
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