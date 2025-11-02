
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Calculator from './components/Calculator';
import MathSolverModal from './components/MathSolverModal';
import MenuDrawer from './components/MenuDrawer';
import { CalculatorMode } from './types';

export default function App() {
    const [isSolverOpen, setIsSolverOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('standard');
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    const handleSelectMode = (mode: CalculatorMode) => {
        setCalculatorMode(mode);
        setIsMenuOpen(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-start p-4 pt-8">
             <MenuDrawer 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                onSelectMode={handleSelectMode}
                currentMode={calculatorMode}
            />
            <Header 
                theme={theme} 
                toggleTheme={toggleTheme} 
                onOpenMenu={() => setIsMenuOpen(true)}
            />
            <main className="mt-8 w-full">
                <Calculator 
                    mode={calculatorMode}
                    onOpenSolver={() => setIsSolverOpen(true)} 
                />
            </main>
            <MathSolverModal 
                isOpen={isSolverOpen} 
                onClose={() => setIsSolverOpen(false)} 
            />
        </div>
    );
}