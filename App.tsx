
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Calculator from './components/Calculator';
import MathSolverModal from './components/MathSolverModal';
import MenuDrawer from './components/MenuDrawer';
import ThemeSelectorModal from './components/ThemeSelectorModal';
import { CalculatorMode, SoundId } from './types';
import { soundService } from './services/soundService';

const getInitialTheme = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedTheme = window.localStorage.getItem('calculator-theme');
        if (storedTheme) {
            return storedTheme;
        }
    }
    return 'liquid-glass'; // Default theme
};

const getInitialSound = (): SoundId => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedSound = window.localStorage.getItem('calculator-sound');
        if (storedSound) {
            return storedSound as SoundId;
        }
    }
    return 'click'; // Default sound
};


export default function App() {
    const [isSolverOpen, setIsSolverOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
    const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('standard');
    const [theme, setTheme] = useState<string>(getInitialTheme);
    const [soundId, setSoundId] = useState<SoundId>(getInitialSound);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('calculator-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('calculator-sound', soundId);
    }, [soundId]);

    const handleSelectMode = (mode: CalculatorMode) => {
        setCalculatorMode(mode);
        setIsMenuOpen(false);
    };
    
    const handleGoHome = () => {
        setCalculatorMode('standard');
        setIsMenuOpen(false); // Close menu if open
    };

    const handlePlaySound = () => {
        soundService.play(soundId);
    };

    const handleSelectSound = (id: SoundId) => {
        setSoundId(id);
        soundService.play(id); // Preview sound on selection
    };

    return (
        <div className="h-screen flex flex-col items-center p-4 pt-8">
             <MenuDrawer 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                onSelectMode={handleSelectMode}
                currentMode={calculatorMode}
            />
            <Header 
                onOpenMenu={() => setIsMenuOpen(true)}
                onGoHome={handleGoHome}
                onOpenThemeSelector={() => setIsThemeSelectorOpen(true)}
            />
            <main className="mt-8 w-full flex-1 overflow-y-auto pb-4">
                <Calculator 
                    mode={calculatorMode}
                    onOpenSolver={() => setIsSolverOpen(true)}
                    playSound={handlePlaySound}
                />
            </main>
            <MathSolverModal 
                isOpen={isSolverOpen} 
                onClose={() => setIsSolverOpen(false)} 
            />
            <ThemeSelectorModal
                isOpen={isThemeSelectorOpen}
                onClose={() => setIsThemeSelectorOpen(false)}
                currentTheme={theme}
                onSelectTheme={setTheme}
                currentSound={soundId}
                onSelectSound={handleSelectSound}
            />
        </div>
    );
}
