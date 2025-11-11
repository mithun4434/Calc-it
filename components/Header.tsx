
import React from 'react';
import MenuIcon from './icons/MenuIcon';
import HomeIcon from './icons/HomeIcon';
import PaletteIcon from './icons/PaletteIcon';

interface HeaderProps {
    onOpenMenu: () => void;
    onGoHome: () => void;
    onOpenThemeSelector: () => void;
}


const Header: React.FC<HeaderProps> = ({ onOpenMenu, onGoHome, onOpenThemeSelector }) => {
    return (
        <header className="text-center w-full max-w-xs sm:max-w-xl mx-auto">
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
                <div className="flex items-center gap-2">
                    <button
                        onClick={onGoHome}
                        className="p-2 rounded-full text-current hover:bg-white/10 dark:hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white/50 transition-colors"
                        aria-label="Go home"
                    >
                        <HomeIcon />
                    </button>
                    <button
                        onClick={onOpenThemeSelector}
                        className="p-2 rounded-full text-current hover:bg-white/10 dark:hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white/50 transition-colors"
                        aria-label="Change theme"
                    >
                        <PaletteIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <p className="mt-3 text-lg font-light text-current opacity-80" style={{textShadow: '0 1px 4px rgba(0,0,0,0.2)'}}>
                A calculator with an AI-powered problem solver for math and physics.
            </p>
        </header>
    );
};

export default Header;