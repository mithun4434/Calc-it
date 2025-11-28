import React, { useCallback, useEffect } from 'react';
import TrashIcon from '../icons/TrashIcon';
import InputWrapper from '../InputWrapper';

interface MatrixInputGridProps {
    title: string;
    rows: number;
    cols: number;
    matrixData: number[][];
    onRowsChange: (rows: number) => void;
    onColsChange: (cols: number) => void;
    onMatrixChange: (matrix: number[][]) => void;
    onRemove?: () => void;
    isRemovable?: boolean;
}

const MatrixInputGrid: React.FC<MatrixInputGridProps> = ({
    title,
    rows,
    cols,
    matrixData,
    onRowsChange,
    onColsChange,
    onMatrixChange,
    onRemove,
    isRemovable,
}) => {
    const handleDimensionChange = useCallback((newRows: number, newCols: number) => {
        const newMatrix = Array(newRows).fill(null).map((_, r) =>
            Array(newCols).fill(null).map((_, c) => {
                // Preserve old value if it exists, otherwise default to 0
                return matrixData[r]?.[c] ?? 0;
            })
        );
        onMatrixChange(newMatrix);
    }, [matrixData, onMatrixChange]);
    
    useEffect(() => {
        handleDimensionChange(rows, cols);
    }, [rows, cols, handleDimensionChange]);

    const handleCellChange = (r: number, c: number, value: string) => {
        const newMatrix = matrixData.map(row => [...row]);
        newMatrix[r][c] = parseFloat(value) || 0;
        onMatrixChange(newMatrix);
    };

    const inputClasses = "w-14 text-center p-1 bg-black/10 dark:bg-black/20 border border-current/10 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors";

    return (
        <div className="relative p-4 bg-black/5 dark:bg-black/20 rounded-3xl space-y-3">
            {isRemovable && (
                 <button
                    type="button"
                    onClick={onRemove}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors z-10"
                    aria-label="Remove Matrix"
                >
                    <TrashIcon />
                </button>
            )}
            <h3 className="text-lg font-bold text-center">{title}</h3>
            <div className="flex justify-center items-center gap-2">
                <InputWrapper value={rows} onClear={() => onRowsChange(1)}>
                    <input
                        type="number"
                        value={rows}
                        onChange={(e) => onRowsChange(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        max="8"
                        className={inputClasses}
                    />
                </InputWrapper>
                <span className="text-lg font-semibold opacity-70">&times;</span>
                <InputWrapper value={cols} onClear={() => onColsChange(1)}>
                    <input
                        type="number"
                        value={cols}
                        onChange={(e) => onColsChange(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        max="8"
                        className={inputClasses}
                    />
                </InputWrapper>
            </div>
            <div className="grid gap-2 overflow-x-auto p-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {matrixData.map((row, rIdx) => (
                    row.map((cell, cIdx) => (
                        <InputWrapper key={`${rIdx}-${cIdx}`} value={cell} onClear={() => handleCellChange(rIdx, cIdx, '0')}>
                            <input
                                type="number"
                                value={cell}
                                onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                className="w-full text-center p-1 bg-black/5 dark:bg-black/10 border border-current/10 rounded-xl font-mono"
                            />
                        </InputWrapper>
                    ))
                ))}
            </div>
        </div>
    );
};

export default MatrixInputGrid;