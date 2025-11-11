
import React, { useState, useEffect } from 'react';
import CheckIcon from './icons/CheckIcon';

interface Theme {
    id: string;
    name: string;
    colors: {
        bg: string;
        text: string;
        accent: string;
    };
}

const themes: Theme[] = [
    { id: 'liquid-glass', name: 'Liquid Glass', colors: { bg: '#1a1a1a', text: '#e5e5e5', accent: '#ffffff' } },
    { id: 'dusk', name: 'Dusk', colors: { bg: '#302b63', text: '#e0e0e0', accent: '#7e57c2' } },
    { id: 'forest', name: 'Forest', colors: { bg: '#4d5d4d', text: '#d4c8b0', accent: '#8a6e4b' } },
    { id: 'cyberpunk', name: 'Cyberpunk', colors: { bg: '#241b43', text: '#00f6ff', accent: '#ff00a0' } },
    { id: 'latte', name: 'Latte', colors: { bg: '#ebedee', text: '#4a423a', accent: '#795548' } },
    { id: 'ocean', name: 'Ocean', colors: { bg: '#003057', text: '#ade6f0', accent: '#5f9ea0' } },
    { id: 'sunset', name: 'Sunset', colors: { bg: '#feb47b', text: '#4a2e27', accent: '#c7563d' } },
    { id: 'mint', name: 'Mint', colors: { bg: '#d4f8d4', text: '#2e8b57', accent: '#3cb371' } },
    { id: 'vaporwave', name: 'Vaporwave', colors: { bg: '#4a0f4a', text: '#00ffff', accent: '#ff69b4' } },
    { id: 'dracula', name: 'Dracula', colors: { bg: '#282a36', text: '#f8f8f2', accent: '#ff79c6' } },
    { id: 'solarized-dark', name: 'Solarized Dark', colors: { bg: '#073642', text: '#93a1a1', accent: '#268bd2' } },
    { id: 'nord', name: 'Nord', colors: { bg: '#3b4252', text: '#d8dee9', accent: '#88c0d0' } },
    { id: 'gruvbox', name: 'Gruvbox', colors: { bg: '#1d2021', text: '#ebdbb2', accent: '#fe8019' } },
    { id: 'monokai', name: 'Monokai', colors: { bg: '#272822', text: '#f8f8f2', accent: '#a6e22e' } },
    { id: 'sakura', name: 'Sakura', colors: { bg: '#ffe4e1', text: '#db7093', accent: '#ff69b4' } },
    { id: 'graphite', name: 'Graphite', colors: { bg: '#232526', text: '#cccccc', accent: '#7f8c8d' } },
    { id: 'terminal', name: 'Terminal', colors: { bg: '#000000', text: '#00ff00', accent: '#00ff00' } },
    { id: 'rose-pine', name: 'Rosé Pine', colors: { bg: '#191724', text: '#e0def4', accent: '#eb6f92' } },
    { id: 'arctic', name: 'Arctic', colors: { bg: '#e5e9f0', text: '#2e3440', accent: '#5e81ac' } },
    { id: 'volcano', name: 'Volcano', colors: { bg: '#2b0808', text: '#ffcbcb', accent: '#ff4747' } },
];

interface ThemeSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: string;
    onSelectTheme: (themeId: string) => void;
}

const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose, currentTheme, onSelectTheme }) => {
    const [isRendered, setIsRendered] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
        }
    }, [isOpen]);

    const handleAnimationEnd = () => {
        if (!isOpen) {
            setIsRendered(false);
        }
    };

    if (!isRendered) return null;

    return (
        <div
            className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${isOpen ? 'modal-backdrop-enter bg-opacity-75' : 'modal-backdrop-exit bg-opacity-0'}`}
            onClick={onClose}
            onAnimationEnd={handleAnimationEnd}
        >
            <div
                className={`glass-panel w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl ${isOpen ? 'modal-content-enter' : 'modal-content-exit'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-current/10">
                    <h2 className="text-xl font-bold">Select Theme</h2>
                    <button onClick={onClose} className="opacity-70 hover:opacity-100 text-3xl leading-none">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {themes.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => onSelectTheme(theme.id)}
                                className={`relative aspect-video rounded-2xl p-3 flex flex-col justify-end transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-gray-400
                                    ${currentTheme === theme.id ? 'ring-2 ring-offset-2 ring-offset-transparent accent-border' : 'subtle-hover-bg'}`}
                                style={{ backgroundColor: theme.colors.bg }}
                            >
                                {currentTheme === theme.id && (
                                    <div className="absolute top-2 right-2 p-1 rounded-full accent-bg accent-text">
                                        <CheckIcon className="w-4 h-4" />
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold" style={{ color: theme.colors.text }}>{theme.name}</span>
                                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeSelectorModal;