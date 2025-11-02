
import React from 'react';

interface MatrixDisplayProps {
    matrix: number[][];
}

const MatrixDisplay: React.FC<MatrixDisplayProps> = ({ matrix }) => {
    if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
        return null;
    }

    const numCols = matrix[0]?.length || 0;

    return (
        <div className="flex items-center justify-center gap-2 mt-4">
            {/* Left Bracket */}
            <div className="text-6xl font-thin opacity-50 select-none -mr-2">[</div>
            
            {/* Matrix Numbers */}
            <div 
                className="grid gap-x-6 gap-y-2 text-center"
                style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
            >
                {matrix.map((row, rowIndex) => (
                    row.map((cell, colIndex) => (
                        <span key={`${rowIndex}-${colIndex}`} className="text-xl font-mono px-2 py-1">
                            {cell}
                        </span>
                    ))
                ))}
            </div>

            {/* Right Bracket */}
            <div className="text-6xl font-thin opacity-50 select-none -ml-2">]</div>
        </div>
    );
};

export default MatrixDisplay;
