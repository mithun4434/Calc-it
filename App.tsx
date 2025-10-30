import React, { useState } from 'react';
import Header from './components/Header';
import Calculator from './components/Calculator';
import MathSolverModal from './components/MathSolverModal';

export default function App() {
    const [isSolverOpen, setIsSolverOpen] = useState(false);

    return (
        <div className="min-h-screen bg-black text-zinc-300 flex flex-col items-center justify-center p-4">
            <Header />
            <main className="mt-8 w-full">
                <Calculator onOpenSolver={() => setIsSolverOpen(true)} />
            </main>
            <MathSolverModal 
                isOpen={isSolverOpen} 
                onClose={() => setIsSolverOpen(false)} 
            />
        </div>
    );
}