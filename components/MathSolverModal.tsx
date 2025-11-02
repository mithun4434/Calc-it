import React, { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Solution } from '../types';
import { extractMathFromImage, solveProblem } from '../services/geminiService';
import Spinner from './Spinner';
import CameraIcon from './icons/CameraIcon';
import MatrixDisplay from './MatrixDisplay';

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
            const result = await solveProblem(problemText);
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

    const handleCameraCapture = async () => {
        try {
            const photo = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera,
            });

            if (photo.dataUrl) {
                handleImageSubmit(photo.dataUrl);
            }
        } catch (error) {
            console.error('Camera capture failed:', error);
            setError("Could not capture image. Please ensure the app has camera permissions.");
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
                throw new Error("Could not find any math or physics problem in the image.");
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300" onClick={handleClose}>
            <div className="glass-panel w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-current/10">
                    <h2 className="text-xl font-bold">Problem Solver</h2>
                    <button onClick={handleClose} className="opacity-70 hover:opacity-100 text-3xl leading-none">&times;</button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Input Section */}
                    <form onSubmit={handleTextSubmit} className="space-y-4">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste or type a math or physics problem here...&#10;e.g., solve 2x + 5 = 15"
                            className="w-full h-28 p-3 bg-black/10 dark:bg-black/20 border border-current/10 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors disabled:opacity-50 placeholder:text-current placeholder:opacity-50"
                            disabled={isLoading}
                        />
                        <div className="flex gap-2 sm:gap-4">
                             <button
                                type="button"
                                onClick={handleCameraCapture}
                                className={`flex-1 flex items-center justify-center gap-2 text-center py-3 px-2 sm:px-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-current/10 font-bold rounded-2xl transition-all duration-300 ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                disabled={isLoading}
                            >
                                <CameraIcon />
                                <span className="hidden sm:inline">Camera</span>
                            </button>
                            <label htmlFor="image-upload" className={`flex-1 text-center py-3 px-2 sm:px-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-current/10 font-bold rounded-2xl transition-all duration-300 ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                Upload
                            </label>
                            <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isLoading} />
                            <button
                                type="submit"
                                className="flex-1 bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-2 sm:px-4 rounded-2xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading || !text.trim()}
                            >
                                {isLoading && imageSrc === null ? <Spinner /> : 'Solve'}
                            </button>
                        </div>
                    </form>

                    {/* Output Section */}
                    {(isLoading || error || solution) && (
                         <div className="border-t border-current/10 pt-6">
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <Spinner />
                                    <p className="mt-4 opacity-70">{loadingMessage}</p>
                                    {problem && <p className="mt-2 text-sm opacity-50 italic">"{problem}"</p>}
                                </div>
                            )}
                            
                            {error && !isLoading && (
                                <div className="text-center p-4 bg-red-500/10 dark:bg-red-900/50 border border-red-500/50 rounded-3xl">
                                    <h3 className="font-bold text-lg mb-2 text-red-700 dark:text-red-300">An Error Occurred</h3>
                                    <p className="opacity-90">{error}</p>
                                </div>
                            )}

                            {solution && !isLoading && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wider">Problem</h3>
                                        {imageSrc && (
                                            <div className="mt-2 border border-current/10 rounded-2xl p-2 max-w-xs mx-auto bg-black/5 dark:bg-black/20">
                                            <img src={imageSrc} alt="Math problem" className="max-h-40 w-auto mx-auto rounded-xl" />
                                            </div>
                                        )}
                                        <p className="mt-2 text-lg font-mono bg-black/5 dark:bg-black/20 p-3 rounded-2xl">{problem}</p>
                                    </div>
                                    
                                    <div className="border-t border-current/10 pt-6">
                                        <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wider">Answer</h3>
                                        <div className="mt-2 text-left bg-gray-500/10 dark:bg-gray-500/20 border border-gray-500/30 p-4 rounded-3xl">
                                            <p className="text-2xl font-bold break-words">{solution.answer}</p>
                                            {solution.matrixAnswer && <MatrixDisplay matrix={solution.matrixAnswer} />}
                                        </div>
                                    </div>
                                    
                                    <div className="border-t border-current/10 pt-6">
                                        <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wider">Step-by-Step Solution</h3>
                                        <ul className="mt-3 space-y-3">
                                            {solution.steps.map((step, index) => (
                                                <li key={index} className="flex items-start gap-3 p-3 bg-black/5 dark:bg-black/20 rounded-2xl">
                                                    <div className="flex-shrink-0 h-6 w-6 bg-gray-500/20 border border-gray-500/30 text-current font-bold text-xs rounded-full flex items-center justify-center mt-1">
                                                        {index + 1}
                                                    </div>
                                                    <p className="opacity-90 leading-relaxed">{step}</p>
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