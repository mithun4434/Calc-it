import React, { useState, useCallback } from 'react';
import { Solution } from '../types';
import { extractMathFromImage, solveMathProblem } from '../services/geminiService';
import Spinner from './Spinner';

interface MathSolverModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MathSolverModal: React.FC<MathSolverModalProps> = ({ isOpen, onClose }) => {
    const [text, setText] = useState('');
    const [problem, setProblem] = useState<string>('');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [solution, setSolution] = useState<Solution | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const resetState = useCallback((clearText: boolean = true) => {
        if(clearText) setText('');
        setProblem('');
        setImageSrc(null);
        setSolution(null);
        setError(null);
        setIsLoading(false);
        setLoadingMessage('');
    }, []);

    const solve = useCallback(async (problemText: string) => {
        setIsLoading(true);
        setLoadingMessage('AI is solving the problem...');
        setError(null);
        setSolution(null);
        setProblem(problemText);
        try {
            const result = await solveMathProblem(problemText);
            setSolution(result);
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, []);

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        resetState(false);
        if (text.trim()) {
            solve(text.trim());
        }
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (typeof event.target?.result === 'string') {
                    handleImageSubmit(event.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageSubmit = useCallback(async (dataUrl: string) => {
        resetState();
        setIsLoading(true);
        setError(null);
        setImageSrc(dataUrl);
        setLoadingMessage('Analyzing image...');
        try {
            const extractedText = await extractMathFromImage(dataUrl);
            if (extractedText) {
                setProblem(extractedText);
                await solve(extractedText);
            } else {
                throw new Error("Could not find any math problem in the image.");
            }
        } catch (e: any) {
            setError(e.message || "An unknown error occurred while processing the image.");
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [solve, resetState]);
    
    if (!isOpen) return null;

    const handleClose = () => {
        onClose();
        resetState(true);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={handleClose}>
            <div className="bg-black rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-zinc-800" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">AI Math Solver</h2>
                    <button onClick={handleClose} className="text-zinc-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Input Section */}
                    <form onSubmit={handleTextSubmit} className="space-y-4">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste or type a math problem here...&#10;e.g., solve 2x + 5 = 15"
                            className="w-full h-28 p-3 bg-zinc-900 border-2 border-zinc-700 rounded-lg focus:ring-2 focus:ring-white focus:border-white transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        />
                        <div className="flex gap-4">
                            <label htmlFor="image-upload" className={`flex-1 text-center py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors duration-300 ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                Upload Image
                            </label>
                            <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isLoading} />
                            <button
                                type="submit"
                                className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center disabled:bg-zinc-500 disabled:text-zinc-700 disabled:cursor-not-allowed"
                                disabled={isLoading || !text.trim()}
                            >
                                {isLoading && imageSrc === null ? <Spinner /> : 'Solve Text'}
                            </button>
                        </div>
                    </form>

                    {/* Output Section */}
                    {(isLoading || error || solution) && (
                         <div className="border-t border-zinc-800 pt-6">
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <Spinner />
                                    <p className="mt-4 text-zinc-400">{loadingMessage}</p>
                                    {problem && <p className="mt-2 text-sm text-zinc-500 italic">"{problem}"</p>}
                                </div>
                            )}
                            
                            {error && !isLoading && (
                                <div className="text-center text-white p-4 bg-zinc-900 border border-zinc-700 rounded-lg">
                                    <h3 className="font-bold text-lg mb-2">An Error Occurred</h3>
                                    <p className="text-zinc-300">{error}</p>
                                </div>
                            )}

                            {solution && !isLoading && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Problem</h3>
                                        {imageSrc && (
                                            <div className="mt-2 border border-zinc-700 rounded-lg p-2 max-w-xs mx-auto bg-zinc-900">
                                            <img src={imageSrc} alt="Math problem" className="max-h-40 w-auto mx-auto rounded-md" />
                                            </div>
                                        )}
                                        <p className="mt-2 text-lg text-zinc-300 bg-zinc-900 p-3 rounded-md">{problem}</p>
                                    </div>
                                    
                                    <div className="border-t border-zinc-800 pt-6">
                                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Answer</h3>
                                        <p className="mt-2 text-3xl font-bold text-white bg-zinc-800/50 p-4 rounded-md break-words">{solution.answer}</p>
                                    </div>
                                    
                                    <div className="border-t border-zinc-800 pt-6">
                                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Step-by-Step Solution</h3>
                                        <ul className="mt-3 space-y-3">
                                            {solution.steps.map((step, index) => (
                                                <li key={index} className="flex items-start gap-3 p-3 bg-zinc-900/70 rounded-md">
                                                    <div className="flex-shrink-0 h-6 w-6 bg-zinc-700 text-white font-bold text-xs rounded-full flex items-center justify-center mt-1">
                                                        {index + 1}
                                                    </div>
                                                    <p className="text-zinc-300 leading-relaxed">{step}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default MathSolverModal;