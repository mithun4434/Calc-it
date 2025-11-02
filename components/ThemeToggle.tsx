
import React from 'react';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

interface ThemeToggleProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <SunIcon className="w-6 h-6 text-white" />
            ) : (
                <MoonIcon className="w-6 h-6 text-black" />
            )}
        </button>
    );
};

export default ThemeToggle;