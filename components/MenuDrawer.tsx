
import React from 'react';
import { CalculatorMode } from '../types';

interface MenuDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMode: (mode: CalculatorMode) => void;
    currentMode: CalculatorMode;
}

const MenuDrawer: React.FC<MenuDrawerProps> = ({ isOpen, onClose, onSelectMode, currentMode }) => {
    const modes: { key: CalculatorMode; label: string }[] = [
        { key: 'standard', label: 'Standard Calculator' },
        { key: 'integration', label: 'Integration' },
        { key: 'differentiation', label: 'Differentiation' },
        { key: 'partialDerivative', label: 'Partial Derivatives' },
        { key: 'matrix', label: 'Matrix' },
        { key: 'temperatureConverter', label: 'Temperature Converter' },
        { key: 'moneyConverter', label: 'Currency Converter' },
    ];
    
    const chatbotMode = { key: 'mit' as const, label: 'MIT' };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${isOpen ? 'opacity-75' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div
                className={`glass-panel fixed top-0 left-0 h-full w-64 !rounded-r-3xl !rounded-l-none z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'transform-none' : '-translate-x-full'}`}
            >
                <div className="flex justify-between items-center p-4 border-b border-current/10">
                    <h2 className="text-xl font-bold">Menu</h2>
                    <button onClick={onClose} className="opacity-70 hover:opacity-100 text-3xl leading-none">&times;</button>
                </div>
                <nav className="p-4 flex flex-col" style={{ height: 'calc(100% - 61px)'}}>
                    <ul className="space-y-1 flex-1 overflow-y-auto pr-2">
                        {modes.map((mode) => (
                            <li key={mode.key}>
                                <button
                                    onClick={() => onSelectMode(mode.key)}
                                    className={`w-full text-left font-semibold p-3 rounded-2xl transition-colors duration-200 ${
                                        currentMode === mode.key
                                            ? 'accent-bg accent-text'
                                            : 'subtle-hover-bg'
                                    }`}
                                >
                                    {mode.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <ul className="pt-2 border-t border-current/10 mt-2">
                         <li>
                            <button
                                onClick={() => onSelectMode(chatbotMode.key)}
                                className={`w-full text-left font-semibold p-3 rounded-2xl transition-colors duration-200 accent-bg accent-text hover:opacity-90 ${
                                    currentMode === chatbotMode.key ? 'opacity-100 ring-2 ring-offset-2 ring-offset-transparent ring-white/50' : 'opacity-80'
                                }`}
                            >
                                {chatbotMode.label}
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </>
    );
};

export default MenuDrawer;
