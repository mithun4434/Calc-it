
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Calculator from './components/Calculator';
import MathSolverModal from './components/MathSolverModal';

export default function App() {
    const [isSolverOpen, setIsSolverOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col items-center justify-start p-4 pt-8 transition-colors duration-300">
            <Header theme={theme} toggleTheme={toggleTheme} />
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