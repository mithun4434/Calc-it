
import React from 'react';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}


const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
    return (
        <header className="text-center w-full max-w-xs mx-auto">
            <div className="flex items-center justify-between">
                {/* Spacer to keep the title perfectly centered */}
                <div className="w-10 h-10" />
                <h1 className="text-4xl sm:text-5xl font-bold text-black dark:text-white">
                    Calc-it
                </h1>
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>
            <p className="mt-3 text-lg text-black dark:text-white">
                A calculator with an AI-powered problem solver for math and physics.
            </p>
        </header>
    );
};

export default Header;