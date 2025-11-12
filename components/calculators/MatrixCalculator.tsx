
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { solveMatrixProblem } from '../../services/geminiService';
import { Solution } from '../../types';
import Spinner from '../Spinner';
import MatrixInputGrid from './MatrixInputGrid';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import SolutionDisplay from '../SolutionDisplay';
import ScrollDownIcon from '../icons/ScrollDownIcon';

type MatrixOperation = 'transpose' | 'determinant' | 'inverse' | 'add' | 'subtract' | 'multiply';

interface MatrixState {
    id: number;
    rows: number;
    cols: number;
    data: number[][];
}

const MatrixCalculator: React.FC = () => {
    const [operation, setOperation] = useState<MatrixOperation>('transpose');
    const [matrices, setMatrices] = useState<MatrixState[]>([]);
    const nextId = useRef(0);
    
    const [solution, setSolution] = useState<Partial<Solution>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [problemStatement, setProblemStatement] = useState('');

    const isUnaryOperation = useMemo(() => ['transpose', 'determinant', 'inverse'].includes(operation), [operation]);
    const isMultiplication = useMemo(() => operation === 'multiply', [operation]);
    const isNaryOperation = useMemo(() => ['add', 'subtract'].includes(operation), [operation]);

    const createMatrix = useCallback((rows: number, cols: number, data?: number[][]): MatrixState => {
        const defaultData = Array(rows).fill(0).map(() => Array(cols).fill(0));
        return {
            id: nextId.current++,
            rows,
            cols,
            data: data || defaultData
        };
    }, []);
    
    useEffect(() => {
        if (isUnaryOperation) {
            setMatrices([createMatrix(2, 2, [[1, 2], [3, 4]])]);
        } else {
            setMatrices([
                createMatrix(2, 2, [[1, 2], [3, 4]]),
                createMatrix(2, 2, [[5, 6], [7, 8]])
            ]);
        }
    }, [isUnaryOperation, createMatrix]);

    const addMatrix = () => {
        const lastMatrix = matrices[matrices.length - 1];
        setMatrices(prev => [...prev, createMatrix(lastMatrix.rows, lastMatrix.cols)]);
    };
    
    const removeMatrix = (id: number) => {
        setMatrices(prev => prev.filter(m => m.id !== id));
    };
    
    const updateMatrix = (id: number, updates: Partial<MatrixState>) => {
        setMatrices(currentMatrices => currentMatrices.map(m => 
            m.id === id ? { ...m, ...updates } : m
        ));
    };
    
    const scrollToResults = () => {
        document.getElementById('solution-display-container')?.scrollIntoView({ behavior: 'smooth' });
    };

    const validateInputs = () => {
        for (const [index, matrix] of matrices.entries()) {
            if (matrix.data.flat().some(cell => isNaN(cell))) {
                return `Matrix ${String.fromCharCode(65 + index)} contains invalid numbers.`;
            }
        }

        if (isUnaryOperation && matrices.length > 0) {
            if ((operation === 'determinant' || operation === 'inverse') && matrices[0].rows !== matrices[0].cols) {
                return "Matrix must be square for this operation.";
            }
        }
        
        if (isNaryOperation && matrices.length > 1) {
            const firstMatrix = matrices[0];
            for (let i = 1; i < matrices.length; i++) {
                if (matrices[i].rows !== firstMatrix.rows || matrices[i].cols !== firstMatrix.cols) {
                    return "All matrices must have the same dimensions for addition/subtraction.";
                }
            }
        }
        
        if (isMultiplication && matrices.length === 2) {
             if (matrices[0].cols !== matrices[1].rows) {
                 return "The number of columns in Matrix A must equal the number of rows in Matrix B for multiplication.";
             }
        }
        return null;
    };
    
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateInputs();
        if (validationError) {
            setError(validationError);
            setSolution({});
            return;
        }

        setIsLoading(true);
        setError(null);
        setSolution({});
        
        const problem = `Calculate the ${operation} of the given matrix/matrices: ${matrices.map((m,i) => `Matrix ${String.fromCharCode(65+i)}`).join(', ')}`;
        setProblemStatement(problem);

        try {
            const result = await solveMatrixProblem(
                operation,
                matrices.map(m => m.data)
            );
            setSolution(result);
        } catch(err: any) {
            setError(err.message || 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [operation, matrices]);

    
    const operations: { key: MatrixOperation; label: string }[] = [
        { key: 'transpose', label: 'Transpose' },
        { key: 'determinant', label: 'Determinant' },
        { key: 'inverse', label: 'Inverse' },
        { key: 'add', label: 'Add' },
        { key: 'subtract', label: 'Subtract' },
        { key: 'multiply', label: 'Multiply' },
    ];

    return (
        <div className="glass-panel w-full max-w-lg mx-auto p-3 sm:p-4 space-y-4 rounded-3xl">
            <h2 className="text-2xl font-bold text-center">Matrix</h2>
            <form onSubmit={handleSubmit} className="space-y-4 p-2">
                
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
                    {operations.map(op => (
                        <button
                            key={op.key}
                            type="button"
                            onClick={() => setOperation(op.key)}
                            className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-2xl transition-colors ${operation === op.key ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20'}`}
                        >
                            {op.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {matrices.map((matrix, index) => (
                        <MatrixInputGrid 
                            key={matrix.id}
                            title={`Matrix ${String.fromCharCode(65 + index)}`}
                            rows={matrix.rows}
                            cols={matrix.cols}
                            matrixData={matrix.data}
                            onRowsChange={rows => updateMatrix(matrix.id, { rows })}
                            onColsChange={cols => updateMatrix(matrix.id, { cols })}
                            onMatrixChange={data => updateMatrix(matrix.id, { data })}
                            isRemovable={isNaryOperation && matrices.length > 2}
                            onRemove={() => removeMatrix(matrix.id)}
                        />
                     ))}
                </div>
                
                {isNaryOperation && (
                    <button 
                        type="button" 
                        onClick={addMatrix}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-2xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 font-semibold transition-colors"
                    >
                       <PlusCircleIcon /> Add Matrix
                    </button>
                )}

                <button
                    type="submit"
                    className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? <Spinner /> : `Calculate ${operation}`}
                </button>
                 {(isLoading || error || solution?.answer) && (
                    <button 
                        type="button" 
                        onClick={scrollToResults}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-2xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 font-semibold transition-colors animate-pulse"
                    >
                       <ScrollDownIcon /> See Answer
                    </button>
                )}
            </form>

             {(isLoading || error || solution?.answer) && (
                 <div className="p-2 border-t border-current/10 mt-4">
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

export default MatrixCalculator;
