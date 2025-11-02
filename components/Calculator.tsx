import React, { useState } from 'react';
import Button from './Button';
import SparklesIcon from './icons/SparklesIcon';
import HistoryIcon from './icons/HistoryIcon';
import HistoryPanel from './HistoryPanel';

interface CalculatorProps {
    onOpenSolver: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ onOpenSolver }) => {
    const [display, setDisplay] = useState('0');
    const [isScientific, setIsScientific] = useState(false);
    const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
    const [isResultDisplayed, setIsResultDisplayed] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const handleInput = (value: string) => {
        if (isResultDisplayed && !'+−×÷^'.includes(value)) {
            setDisplay(value);
            setIsResultDisplayed(false);
        } else {
            setDisplay(prev => (prev === '0' ? value : prev + value));
            setIsResultDisplayed(false);
        }
    };

    const handleDot = () => {
        if (isResultDisplayed) {
            setDisplay('0.');
            setIsResultDisplayed(false);
            return;
        }
        // This regex splits by operators, keeping them in the result array
        const parts = display.split(/([+−×÷^()])/);
        const lastPart = parts[parts.length - 1];

        // Add a dot only if the last number segment doesn't have one
        if (lastPart !== '' && !lastPart.includes('.')) {
            setDisplay(display + '.');
        } else if (lastPart === '' && display.length > 0 && display !== '(') {
            // Case where display ends with an operator e.g., "5+"
            setDisplay(display + '0.');
        }
    };
    
    const handleFunction = (func: string) => {
        const value = `${func}(`;
        if (isResultDisplayed) {
            setDisplay(value);
            setIsResultDisplayed(false);
        } else {
            setDisplay(prev => (prev === '0' ? value : prev + value));
            setIsResultDisplayed(false);
        }
    };

    const clearAll = () => {
        setDisplay('0');
        setIsResultDisplayed(false);
    };

    const backspace = () => {
        if (isResultDisplayed) {
            clearAll();
            return;
        }
        setDisplay(prev => {
            const newDisplay = prev.slice(0, -1);
            return newDisplay === '' ? '0' : newDisplay;
        });
    };
    
    const handleToggleSign = () => {
        if (display === 'Error') return;

        // Handle toggling the sign of a final result
        if (isResultDisplayed) {
            setDisplay(prev => {
                if (prev === '0') return '0';
                return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
            });
            // A toggled result should behave like a new input
            setIsResultDisplayed(false);
            return;
        }

        // Find the starting index of the last number segment in the expression
        let startIndex = -1;
        for (let i = display.length - 1; i >= 0; i--) {
            const char = display[i];
            if ('+−×÷^('.includes(char)) {
                // The number starts after this operator
                startIndex = i + 1;
                break;
            }
        }
        if (startIndex === -1) { // No operator found, the whole string is the number
            startIndex = 0;
        }

        const prefix = display.substring(0, startIndex);
        const numberStr = display.substring(startIndex);
        
        // Do nothing if the last segment is empty (e.g. after "5+")
        if (numberStr === '') return;
        
        if (numberStr.startsWith('-')) {
            // It's a negative number, make it positive
            setDisplay(prefix + numberStr.slice(1));
        } else {
            // It's a positive number, make it negative
            setDisplay(prefix + '-' + numberStr);
        }
    };

    const handleSquare = () => {
        if (display === 'Error') return;
        setDisplay(prev => `(${prev})^2`);
        setIsResultDisplayed(false);
    };

    const calculateResult = () => {
        if (isResultDisplayed || display === 'Error') return;

        let evalExpr = display;
        
        // Sanitize trailing operators to prevent syntax errors
        const trailingOperatorRegex = /[+−×÷^.]$/;
        if (trailingOperatorRegex.test(evalExpr)) {
            evalExpr = evalExpr.slice(0, -1);
        }

        // Handle implicit multiplication e.g., (5)(2) -> (5)*(2) or 2π -> 2*Math.PI
        evalExpr = evalExpr.replace(/\)(\()/g, ')*(');
        evalExpr = evalExpr.replace(/(\d)π/g, '$1*Math.PI');
        evalExpr = evalExpr.replace(/\)π/g, ')*Math.PI');
        evalExpr = evalExpr.replace(/(\d)\(/g, '$1*(');


        // Handle trig functions first, with degree mode having priority.
        if (angleMode === 'deg') {
            evalExpr = evalExpr.replace(/sin\(/g, 'Math.sin(Math.PI/180 *');
            evalExpr = evalExpr.replace(/cos\(/g, 'Math.cos(Math.PI/180 *');
            evalExpr = evalExpr.replace(/tan\(/g, 'Math.tan(Math.PI/180 *');
        } else {
            evalExpr = evalExpr.replace(/sin\(/g, 'Math.sin(');
            evalExpr = evalExpr.replace(/cos\(/g, 'Math.cos(');
            evalExpr = evalExpr.replace(/tan\(/g, 'Math.tan(');
        }
        
        // Now do all other replacements
        evalExpr = evalExpr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/π/g, 'Math.PI')
            .replace(/e/g, 'Math.E')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/\^/g, '**');

        try {
            const openParen = (evalExpr.match(/\(/g) || []).length;
            const closeParen = (evalExpr.match(/\)/g) || []).length;
            evalExpr += ')'.repeat(openParen - closeParen);
            
            const result = new Function('return ' + evalExpr)();
            if (isNaN(result) || !isFinite(result)) {
                setDisplay('Error');
            } else {
                const finalResult = String(Number(result.toPrecision(15)));
                const historyEntry = `${display} = ${finalResult}`;

                // Prevent duplicate entries if user spams '='
                if (history[0] !== historyEntry) {
                    setHistory(prev => [historyEntry, ...prev].slice(0, 50));
                }

                setDisplay(finalResult);
            }
        } catch (e) {
            console.error("Calculation Error:", e);
            setDisplay('Error');
        } finally {
            setIsResultDisplayed(true);
        }
    };

    const baseButtonClasses = "text-3xl sm:text-4xl";
    const squareButtonClasses = " aspect-square";
    
    const specialFuncBtn = `bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600 text-black dark:text-white ${baseButtonClasses}`;
    const opBtn = `bg-zinc-800 hover:bg-zinc-900 text-white dark:bg-zinc-300 dark:hover:bg-zinc-200 dark:text-black ${baseButtonClasses}`;
    const numBtn = `bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-black dark:text-white ${baseButtonClasses}`;
    const sciBtn = `bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-white ${baseButtonClasses}`;

    return (
        <div className="w-full max-w-xs mx-auto bg-zinc-100 dark:bg-black rounded-3xl p-2 sm:p-3 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 transition-all duration-300">
            <Button onClick={onOpenSolver} className="w-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black flex items-center justify-center gap-2 py-3">
                <SparklesIcon /> <span className="text-4xl">Problem Solver</span>
            </Button>
            
            <div className="relative bg-zinc-100 dark:bg-black text-black dark:text-white text-6xl md:text-7xl text-right rounded-2xl p-4 sm:p-6 overflow-x-auto break-all transition-colors duration-300 min-h-[8rem] flex items-end justify-end">
                <button 
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
                    className="absolute top-2 right-2 p-2 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    aria-label="Toggle history"
                >
                    <HistoryIcon />
                </button>
                {display}
            </div>

            <div className="relative">
                 {isHistoryOpen && (
                    <HistoryPanel
                        history={history}
                        onSelectHistory={(value) => {
                            setDisplay(value);
                            setIsHistoryOpen(false);
                            setIsResultDisplayed(true); // Treat selected value as a result
                        }}
                        onClearHistory={() => setHistory([])}
                    />
                )}

                <div className="grid grid-cols-4 gap-3">
                    {isScientific && (
                        <>
                            <div className="col-span-4 grid grid-cols-6 gap-3">
                                <Button onClick={() => handleFunction('sin')} className={`${sciBtn}${squareButtonClasses}`}>sin</Button>
                                <Button onClick={() => handleFunction('cos')} className={`${sciBtn}${squareButtonClasses}`}>cos</Button>
                                <Button onClick={() => handleFunction('tan')} className={`${sciBtn}${squareButtonClasses}`}>tan</Button>
                                <Button onClick={() => handleFunction('ln')} className={`${sciBtn}${squareButtonClasses}`}>ln</Button>
                                <Button onClick={() => handleFunction('log')} className={`${sciBtn}${squareButtonClasses}`}>log</Button>
                                <Button onClick={() => setAngleMode(p => p === 'deg' ? 'rad' : 'deg')} className={`${sciBtn}${squareButtonClasses} text-2xl sm:text-3xl`}>{angleMode.toUpperCase()}</Button>
                                
                                <Button onClick={() => handleInput('(')} className={`${sciBtn}${squareButtonClasses}`}>(</Button>
                                <Button onClick={() => handleInput(')')} className={`${sciBtn}${squareButtonClasses}`}>)</Button>
                                <Button onClick={handleSquare} className={`${sciBtn}${squareButtonClasses}`}>x²</Button>
                                <Button onClick={() => handleInput('^')} className={`${sciBtn}${squareButtonClasses}`}>xʸ</Button>
                                <Button onClick={() => handleFunction('√')} className={`${sciBtn}${squareButtonClasses}`}>√</Button>
                                <Button onClick={() => handleInput('π')} className={`${sciBtn}${squareButtonClasses}`}>π</Button>
                            </div>
                        </>
                    )}

                    <Button onClick={clearAll} className={`${specialFuncBtn}${squareButtonClasses}`}>AC</Button>
                    <Button onClick={backspace} className={`${specialFuncBtn}${squareButtonClasses}`}>DEL</Button>
                    <Button onClick={() => setIsScientific(!isScientific)} className={`${specialFuncBtn}${squareButtonClasses}`}>{isScientific ? 'std' : 'sci'}</Button>
                    <Button onClick={() => handleInput('÷')} className={`${opBtn}${squareButtonClasses}`}>&divide;</Button>

                    <Button onClick={() => handleInput('7')} className={`${numBtn}${squareButtonClasses}`}>7</Button>
                    <Button onClick={() => handleInput('8')} className={`${numBtn}${squareButtonClasses}`}>8</Button>
                    <Button onClick={() => handleInput('9')} className={`${numBtn}${squareButtonClasses}`}>9</Button>
                    <Button onClick={() => handleInput('×')} className={`${opBtn}${squareButtonClasses}`}>&times;</Button>
                    
                    <Button onClick={() => handleInput('4')} className={`${numBtn}${squareButtonClasses}`}>4</Button>
                    <Button onClick={() => handleInput('5')} className={`${numBtn}${squareButtonClasses}`}>5</Button>
                    <Button onClick={() => handleInput('6')} className={`${numBtn}${squareButtonClasses}`}>6</Button>
                    <Button onClick={() => handleInput('−')} className={`${opBtn}${squareButtonClasses}`}>&minus;</Button>
                    
                    <Button onClick={() => handleInput('1')} className={`${numBtn}${squareButtonClasses}`}>1</Button>
                    <Button onClick={() => handleInput('2')} className={`${numBtn}${squareButtonClasses}`}>2</Button>
                    <Button onClick={() => handleInput('3')} className={`${numBtn}${squareButtonClasses}`}>3</Button>
                    <Button onClick={() => handleInput('+')} className={`${opBtn}${squareButtonClasses}`}>+</Button>

                    <Button onClick={handleToggleSign} className={`${specialFuncBtn}${squareButtonClasses}`}>+/-</Button>
                    <Button onClick={() => handleInput('0')} className={`${numBtn}${squareButtonClasses}`}>0</Button>
                    <Button onClick={handleDot} className={`${numBtn}${squareButtonClasses}`}>.</Button>
                    <Button onClick={calculateResult} className={`${opBtn}${squareButtonClasses}`}>=</Button>
                </div>
            </div>
        </div>
    );
};

export default Calculator;