import React, { useState, useCallback } from 'react';
import { solveProblem } from '../../services/geminiService';
import { Solution } from '../../types';
import Spinner from '../Spinner';
import SolutionDisplay from '../SolutionDisplay';

type IntegrationCount = 1 | 2 | 3;

const IntegrationCalculator: React.FC = () => {
    const [integrationCount, setIntegrationCount] = useState<IntegrationCount>(1);
    const [expression, setExpression] = useState('x^2');
    const [variables, setVariables] = useState(['x', 'y', 'z']);
    const [bounds, setBounds] = useState([
        { lower: '0', upper: '1' },
        { lower: '0', upper: '1' },
        { lower: '0', upper: '1' },
    ]);
    const [isDefinite, setIsDefinite] = useState(false);
    
    const [solution, setSolution] = useState<Solution | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [problemStatement, setProblemStatement] = useState('');

    const handleVariableChange = (index: number, value: string) => {
        const newVariables = [...variables];
        newVariables[index] = value;
        setVariables(newVariables);
    };

    const handleBoundsChange = (index: number, type: 'lower' | 'upper', value: string) => {
        const newBounds = [...bounds];
        newBounds[index][type] = value;
        setBounds(newBounds);
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expression.trim()) {
            setError("Function expression cannot be empty.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSolution(null);
        
        const countMap = ["", "single", "double", "triple"];
        const integralType = isDefinite ? 'definite' : 'indefinite';
        const activeVariables = variables.slice(0, integrationCount);
        
        let problem = `Calculate the ${integralType} ${countMap[integrationCount]} integral of ${expression}`;
        problem += ` with respect to ${activeVariables.join(', then ')}.`;
        
        if (isDefinite) {
            const boundsText = bounds.slice(0, integrationCount)
                .map((b, i) => `from ${b.lower || '?'} to ${b.upper || '?'} for d${activeVariables[i]}`)
                .join(', ');
            problem += ` with bounds ${boundsText}.`;
        } else {
            problem += " Provide the constant of integration as '+ C'.";
        }
        setProblemStatement(problem);

        try {
            const result = await solveProblem(problem);
            setSolution(result);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [expression, variables, bounds, isDefinite, integrationCount]);

    const inputClasses = "bg-black/10 dark:bg-black/20 border border-current/10 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors placeholder:text-current placeholder:opacity-50";

    return (
        <div className="glass-panel w-full max-w-md mx-auto p-3 sm:p-4 space-y-4 rounded-3xl">
            <h2 className="text-2xl font-bold text-center">Integration Calculator</h2>
            <form onSubmit={handleSubmit} className="space-y-4 p-2">
                
                <div className="flex justify-center gap-2">
                    {[1, 2, 3].map(count => (
                        <button key={count} type="button" onClick={() => setIntegrationCount(count as IntegrationCount)}
                         className={`px-3 py-2 text-sm font-semibold rounded-2xl transition-colors ${integrationCount === count ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20'}`}>
                            {['Single', 'Double', 'Triple'][count-1]} ∫
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                     <span className="text-5xl opacity-70 font-serif">{'∫'.repeat(integrationCount)}</span>
                    <input
                        type="text"
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        placeholder="f(x,y...)"
                        className={`w-full p-2 ${inputClasses}`}
                        disabled={isLoading}
                    />
                    {Array.from({ length: integrationCount }).map((_, i) => (
                         <div key={i} className="flex items-center">
                            <span className="text-2xl opacity-70 font-serif italic">d</span>
                            <input
                                type="text"
                                value={variables[i]}
                                onChange={(e) => handleVariableChange(i, e.target.value)}
                                className={`w-10 p-1 ml-1 text-center ${inputClasses}`}
                                maxLength={3}
                                disabled={isLoading}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="integralType" checked={!isDefinite} onChange={() => setIsDefinite(false)}
                            className="form-radio text-gray-700 dark:text-gray-300 bg-transparent border-current/20 focus:ring-gray-500"/>
                        <span>Indefinite</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="integralType" checked={isDefinite} onChange={() => setIsDefinite(true)}
                            className="form-radio text-gray-700 dark:text-gray-300 bg-transparent border-current/20 focus:ring-gray-500"/>
                        <span>Definite</span>
                    </label>
                </div>

                {isDefinite && (
                    <div className="space-y-2 p-2 bg-black/5 dark:bg-black/20 rounded-2xl">
                        <h4 className="text-sm font-semibold text-center opacity-70">Bounds</h4>
                        {Array.from({ length: integrationCount }).map((_, i) => (
                             <div key={i} className="flex items-center justify-center gap-2">
                                <span className="font-mono">d{variables[i]}:</span>
                                <input type="text" value={bounds[i].lower} onChange={e => handleBoundsChange(i, 'lower', e.target.value)} placeholder="lower" className={`w-20 text-center ${inputClasses} p-1`}/>
                                <span className="opacity-70">to</span>
                                <input type="text" value={bounds[i].upper} onChange={e => handleBoundsChange(i, 'upper', e.target.value)} placeholder="upper" className={`w-20 text-center ${inputClasses} p-1`}/>
                            </div>
                        ))}
                    </div>
                )}


                <button
                    type="submit"
                    className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center disabled:opacity-50"
                    disabled={isLoading || !expression.trim()}
                >
                    {isLoading ? <Spinner /> : 'Solve Integral'}
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

export default IntegrationCalculator;