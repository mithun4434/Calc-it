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
    
    const chatbotMode = { key: 'chatbotTeacher' as const, label: 'ASK' };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
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
                <nav className="p-4 flex flex-col justify-between" style={{ height: 'calc(100% - 61px)'}}>
                    <ul className="space-y-1">
                        {modes.map((mode) => (
                            <li key={mode.key}>
                                <button
                                    onClick={() => onSelectMode(mode.key)}
                                    className={`w-full text-left font-semibold p-3 rounded-2xl transition-colors duration-200 ${
                                        currentMode === mode.key
                                            ? 'bg-black dark:bg-white text-white dark:text-black'
                                            : 'hover:bg-black/10 dark:hover:bg-white/10'
                                    }`}
                                >
                                    {mode.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <ul>
                         <li>
                            <button
                                onClick={() => onSelectMode(chatbotMode.key)}
                                className={`w-full text-left font-semibold p-3 rounded-2xl transition-colors duration-200 ${
                                    currentMode === chatbotMode.key
                                        ? 'bg-blue-500 dark:bg-blue-600 text-white'
                                        : 'bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600'
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