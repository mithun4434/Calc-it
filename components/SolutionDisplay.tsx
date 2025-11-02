import React from 'react';
import { Solution } from '../types';
import Spinner from './Spinner';
import MatrixDisplay from './MatrixDisplay';

interface SolutionDisplayProps {
    problemStatement: string;
    solution: Solution | null;
    isLoading: boolean;
    error: string | null;
}

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ problemStatement, solution, isLoading, error }) => {
    if (!problemStatement && !isLoading && !error) {
        return null; 
    }

    return (
        <div className="mt-4 w-full">
            <div className="space-y-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                        <Spinner />
                        <p className="mt-4 opacity-70">AI is thinking...</p>
                        {problemStatement && <p className="mt-2 text-sm opacity-50 italic">Solving: "{problemStatement}"</p>}
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
                            <p className="mt-2 text-lg font-mono bg-black/5 dark:bg-black/20 p-3 rounded-2xl">{problemStatement}</p>
                        </div>
                        
                        <div className="border-t border-current/10 pt-6">
                            <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wider">Answer</h3>
                             <div className="mt-2 text-left bg-gray-500/10 dark:bg-gray-500/20 border border-gray-500/30 p-4 rounded-3xl">
                                <p className="text-2xl font-bold break-words">{solution.answer}</p>
                                {solution.matrixAnswer && <MatrixDisplay matrix={solution.matrixAnswer} />}
                                {solution.scalarAnswer !== undefined && (
                                        <p className="text-4xl font-mono mt-4 text-center">{solution.scalarAnswer}</p>
                                )}
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
        </div>
    );
};

export default SolutionDisplay;