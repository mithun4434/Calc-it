
import React from 'react';
import { Solution } from '../types';
import Spinner from './Spinner';

interface SolutionDisplayProps {
    problem: string;
    imageSrc: string | null;
    solution: Solution | null;
    isLoading: boolean;
    error: string | null;
}

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ problem, imageSrc, solution, isLoading, error }) => {
    if (!problem && !isLoading && !error) {
        return null; // Don't render anything if there's no activity
    }

    return (
        <div className="mt-8 w-full">
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 min-h-[10rem] flex flex-col justify-center">
                
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center">
                        <Spinner />
                        <p className="mt-4 text-gray-400">AI is thinking...</p>
                        {problem && <p className="mt-2 text-sm text-gray-500 italic">Solving: "{problem}"</p>}
                    </div>
                )}
                
                {error && !isLoading && (
                    <div className="text-center text-red-400 p-4 bg-red-900/50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2">An Error Occurred</h3>
                        <p>{error}</p>
                    </div>
                )}
                
                {solution && !isLoading && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Problem</h3>
                            {imageSrc && (
                                <div className="mt-2 border border-gray-600 rounded-lg p-2 max-w-xs mx-auto bg-gray-900">
                                  <img src={imageSrc} alt="Math problem" className="max-h-40 w-auto mx-auto rounded-md" />
                                </div>
                            )}
                            <p className="mt-2 text-lg text-cyan-300 font-mono bg-gray-900/50 p-3 rounded-md">{problem}</p>
                        </div>
                        
                        <div className="border-t border-gray-700 pt-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Answer</h3>
                            <p className="mt-2 text-3xl font-bold text-green-400 bg-green-900/30 p-4 rounded-md">{solution.answer}</p>
                        </div>
                        
                        <div className="border-t border-gray-700 pt-6">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Step-by-Step Solution</h3>
                            <ul className="mt-3 space-y-3">
                                {solution.steps.map((step, index) => (
                                    <li key={index} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-md">
                                        <div className="flex-shrink-0 h-6 w-6 bg-indigo-500 text-white font-bold text-xs rounded-full flex items-center justify-center mt-1">
                                            {index + 1}
                                        </div>
                                        <p className="text-gray-300 leading-relaxed">{step}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SolutionDisplay;
