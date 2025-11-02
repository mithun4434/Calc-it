import React, { useState, useCallback } from 'react';
import { solveCalculusProblem } from '../../services/geminiService';
import { Solution } from '../../types';
import Spinner from '../Spinner';
import SolutionDisplay from '../SolutionDisplay';

const DifferentiationCalculator: React.FC = () => {
    const [expression, setExpression] = useState('');
    const [variable, setVariable] = useState('x');
    
    const [solution, setSolution] = useState<Solution | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [problemStatement, setProblemStatement] = useState('');

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expression.trim() || !variable.trim()) {
            setError("Function and variable cannot be empty.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSolution(null);
        
        const problemString = `d/d${variable} (${expression})`;
        setProblemStatement(problemString);

        try {
            const result = await solveCalculusProblem('differentiation', {
                expression,
                variable,
            });
            setSolution(result);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [expression, variable]);

    const inputClasses = "bg-black/10 dark:bg-black/20 border border-current/10 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors placeholder:text-current placeholder:opacity-50";


    return (
        <div className="glass-panel w-full max-w-xs mx-auto p-3 sm:p-4 space-y-4 rounded-3xl">
            <h2 className="text-2xl font-bold text-center">Differentiation Calculator</h2>
            <form onSubmit={handleSubmit} className="space-y-4 p-2">
                <div className="flex items-center gap-2">
                     <div className="flex flex-col items-center">
                        <span className="text-2xl opacity-70 font-serif italic">d</span>
                        <div className="border-t-2 border-current opacity-70 w-8 my-1"></div>
                        <div className="flex">
                            <span className="text-2xl opacity-70 font-serif italic">d</span>
                            <input
                                type="text"
                                value={variable}
                                onChange={(e) => setVariable(e.target.value)}
                                className={`w-8 p-1 ml-1 text-center ${inputClasses}`}
                                maxLength={3}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                     <span className="text-4xl opacity-70 -mt-2">(</span>
                    <input
                        type="text"
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        placeholder="f(x)"
                        className={`w-full p-2 ${inputClasses}`}
                        disabled={isLoading}
                    />
                     <span className="text-4xl opacity-70 -mt-2">)</span>
                </div>

                <button
                    type="submit"
                    className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center disabled:opacity-50"
                    disabled={isLoading || !expression.trim()}
                >
                    {isLoading ? <Spinner /> : 'Solve Derivative'}
                </button>
            </form>

            {(isLoading || error || solution) && (
                <div className="p-2 border-t border-current/10">
                     <SolutionDisplay 
                        problemStatement={problemStatement}
                        solution={solution}
                        isLoading={isLoading}
                        error={error}
                    />
                </div>
            )}
        </div>
    );
};

export default DifferentiationCalculator;