
import React from 'react';
import ThemeToggle from './ThemeToggle';
import MenuIcon from './icons/MenuIcon';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onOpenMenu: () => void;
}


const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onOpenMenu }) => {
    return (
        <header className="text-center w-full max-w-xs mx-auto">
            <div className="flex items-center justify-between">
                <button
                    onClick={onOpenMenu}
                    className="p-2 rounded-full text-current hover:bg-white/10 dark:hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white/50 transition-colors"
                    aria-label="Open menu"
                >
                    <MenuIcon />
                </button>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-wider" style={{textShadow: '0 2px 8px rgba(0,0,0,0.2)'}}>
                    Calc-it
                </h1>
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>
            <p className="mt-3 text-lg font-light text-current opacity-80" style={{textShadow: '0 1px 4px rgba(0,0,0,0.2)'}}>
                A calculator with an AI-powered problem solver for math and physics.
            </p>
        </header>
    );
};

export default Header;