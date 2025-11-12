
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
    { id: 'liquid-glass', name: 'Default/Dark', colors: { bg: '#1a1a1a', text: '#e5e5e5', accent: '#ffffff' } },
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
    { id: 'grunge-paper', name: 'Grunge Paper', colors: { bg: '#fdf5e6', text: '#5a4430', accent: '#8d6e63' } },
    { id: 'stitched-leather', name: 'Stitched Leather', colors: { bg: '#3d2b1f', text: '#d2b48c', accent: '#8b4513' } },
    { id: 'cracked-earth', name: 'Cracked Earth', colors: { bg: '#8b4513', text: '#f5deb3', accent: '#cd853f' } },
    { id: 'galactic-swirl', name: 'Galactic Swirl', colors: { bg: '#1f005c', text: '#f0f0ff', accent: '#8e2de2' } },
    { id: 'liquid-metal', name: 'Liquid Metal', colors: { bg: '#a9a9a9', text: '#1c1c1c', accent: '#808080' } },
    { id: 'crumpled-paper', name: 'Crumpled Paper', colors: { bg: '#f1f1f1', text: '#333', accent: '#a0a0a0' } },
    { id: 'rich-velvet', name: 'Rich Velvet', colors: { bg: '#800020', text: '#ffd700', accent: '#b22222' } },
    { id: 'rusted-metal', name: 'Rusted Metal', colors: { bg: '#7b3f00', text: '#e6e6e6', accent: '#d2691e' } },
    { id: 'holographic', name: 'Holographic', colors: { bg: 'linear-gradient(135deg, #ff00c1, #00fff2)', text: '#fff', accent: '#fff' } },
    { id: 'tartan-plaid', name: 'Tartan Plaid', colors: { bg: '#a52a2a', text: '#f0e68c', accent: '#b22222' } },
    { id: 'camo', name: 'Camo', colors: { bg: '#556b2f', text: '#f5f5f5', accent: '#8fbc8f' } },
    { id: 'glitch', name: 'Glitch', colors: { bg: '#000', text: '#fff', accent: '#fff' } },
    { id: 'water-ripples', name: 'Water Ripples', colors: { bg: '#87ceeb', text: '#00008b', accent: '#4682b4' } },
    { id: 'art-deco', name: 'Art Deco', colors: { bg: '#0c0c0c', text: '#e6e6e6', accent: '#d4af37' } },
    { id: 'peeling-paint', name: 'Peeling Paint', colors: { bg: '#bdb76b', text: '#556b2f', accent: '#808000' } },
    { id: 'pixel-sky', name: 'Pixel Sky', colors: { bg: '#87ceeb', text: '#191970', accent: '#ffffff' } },
    { id: 'scribble-wall', name: 'Scribble Wall', colors: { bg: '#fafafa', text: '#333', accent: '#888' } },
    { id: 'bio-lume', name: 'Bio-Luminescence', colors: { bg: '#0a192f', text: '#64ffda', accent: '#00e5ff' } },
    { id: 'washi-paper', name: 'Washi Paper', colors: { bg: '#f7f3e9', text: '#6b4f3a', accent: '#8d6e63' } },
    { id: 'dark-marble', name: 'Dark Marble', colors: { bg: '#1a1a1a', text: '#e0e0e0', accent: '#c0c0c0' } },
    { id: 'zebra', name: 'Zebra', colors: { bg: '#f5f5f5', text: '#000000', accent: '#333333' } },
    { id: 'leopard-print', name: 'Leopard Print', colors: { bg: '#d2b48c', text: '#5c4033', accent: '#8b4513' } }
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
                                style={{ background: theme.colors.bg }}
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
