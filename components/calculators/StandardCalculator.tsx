
import React, { useState, useEffect, useCallback } from 'react';
import Button from '../Button';
import SparklesIcon from '../icons/SparklesIcon';
import HistoryIcon from '../icons/HistoryIcon';
import HistoryPanel from '../HistoryPanel';
import BackspaceIcon from '../icons/BackspaceIcon';

interface StandardCalculatorProps {
    onOpenSolver: () => void;
    playSound: () => void;
}

const StandardCalculator: React.FC<StandardCalculatorProps> = ({ onOpenSolver, playSound }) => {
    const [display, setDisplay] = useState('0');
    const [isScientific, setIsScientific] = useState(false);
    const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
    const [isResultDisplayed, setIsResultDisplayed] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const triggerSound = useCallback(() => {
        playSound();
    }, [playSound]);

    const clearAll = useCallback(() => {
        triggerSound();
        setDisplay('0');
        setIsResultDisplayed(false);
    }, [triggerSound]);

    const backspace = useCallback(() => {
        triggerSound();
        if (isResultDisplayed) {
            clearAll();
            return;
        }
        setDisplay(prev => {
            const newDisplay = prev.slice(0, -1);
            return newDisplay === '' ? '0' : newDisplay;
        });
    }, [isResultDisplayed, clearAll, triggerSound]);

    const handleInput = useCallback((value: string) => {
        triggerSound();
        if (isResultDisplayed && !'+−×÷^'.includes(value)) {
            setDisplay(value);
            setIsResultDisplayed(false);
        } else {
            setDisplay(prev => (prev === '0' ? value : prev + value));
            setIsResultDisplayed(false);
        }
    }, [isResultDisplayed, triggerSound]);

    const handleDot = useCallback(() => {
        triggerSound();
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
    }, [isResultDisplayed, display, triggerSound]);
    
    const handleFunction = useCallback((func: string) => {
        triggerSound();
        const value = `${func}(`;
        if (isResultDisplayed) {
            setDisplay(value);
            setIsResultDisplayed(false);
        } else {
            setDisplay(prev => (prev === '0' ? value : prev + value));
            setIsResultDisplayed(false);
        }
    }, [isResultDisplayed, triggerSound]);

    const handleToggleSign = useCallback(() => {
        triggerSound();
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
    }, [display, isResultDisplayed, triggerSound]);

    const handleSquare = useCallback(() => {
        triggerSound();
        if (display === 'Error') return;
        setDisplay(prev => `(${prev})^2`);
        setIsResultDisplayed(false);
    }, [display, triggerSound]);

    const calculateResult = useCallback(() => {
        triggerSound();
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
    }, [display, isResultDisplayed, angleMode, history, triggerSound]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
                return;
            }

            let handled = true;

            if (event.key >= '0' && event.key <= '9') {
                handleInput(event.key);
            } else if (event.key === '.') {
                handleDot();
            } else if (event.key === '+') {
                handleInput('+');
            } else if (event.key === '-') {
                handleInput('−');
            } else if (event.key === '*') {
                handleInput('×');
            } else if (event.key === '/') {
                handleInput('÷');
            } else if (event.key === '^') {
                handleInput('^');
            } else if (event.key === '(') {
                handleInput('(');
            } else if (event.key === ')') {
                handleInput(')');
            } else if (event.key === 'Backspace') {
                backspace();
            } else if (event.key === 'Enter' || event.key === '=') {
                calculateResult();
            } else if (event.key.toLowerCase() === 'c' || event.key === 'Escape') {
                clearAll();
            } else {
                handled = false;
            }
            
            if (handled) {
                event.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleInput, handleDot, backspace, calculateResult, clearAll]);

    // Fixed height classes to maintain vertical rhythm regardless of column width
    const baseButtonClasses = "h-14 sm:h-16 w-full !text-2xl sm:!text-3xl transition-transform duration-100 active:scale-95";
    const glassButtonBase = "backdrop-blur-md border border-current/10";
    
    const specialFuncBtn = `subtle-bg subtle-hover-bg ${glassButtonBase} ${baseButtonClasses}`;
    const opBtn = `accent-bg accent-text hover:opacity-90 ${baseButtonClasses}`;
    const numBtn = `subtle-bg subtle-hover-bg ${glassButtonBase} ${baseButtonClasses}`;
    const sciFuncBtn = `${specialFuncBtn} !text-xl sm:!text-2xl`;
    const angleToggleBtn = `${sciFuncBtn} !text-base sm:!text-lg`;

    const handleToggleScientific = () => {
        triggerSound();
        setIsScientific(!isScientific);
    };

    return (
        <div className={`glass-panel w-full mx-auto p-2 sm:p-3 space-y-3 transition-all duration-300 ease-in-out rounded-3xl ${isScientific ? 'max-w-2xl' : 'max-w-xs'}`}>
            <Button onClick={onOpenSolver} className="w-full h-16 accent-bg accent-text hover:opacity-90 flex items-center justify-center gap-2 text-2xl">
                <SparklesIcon /> <span className="text-2xl font-bold">Problem Solver</span>
            </Button>
            
            <div className="relative bg-black/10 dark:bg-black/20 text-right rounded-3xl p-4 sm:p-6 overflow-x-auto break-all min-h-[8rem] flex items-end justify-end border border-current/10">
                <button 
                    onClick={() => { triggerSound(); setIsHistoryOpen(!isHistoryOpen); }} 
                    className="absolute top-2 right-2 p-2 opacity-60 hover:opacity-100 rounded-full subtle-hover-bg transition-colors"
                    aria-label="Toggle history"
                >
                    <HistoryIcon />
                </button>
                <span className="font-light text-5xl">{display}</span>
            </div>

            <div className="relative">
                 {isHistoryOpen && (
                    <HistoryPanel
                        history={history}
                        onSelectHistory={(value) => {
                            triggerSound();
                            setDisplay(value);
                            setIsHistoryOpen(false);
                            setIsResultDisplayed(true);
                        }}
                        onClearHistory={() => setHistory([])}
                    />
                )}
                
                <div className="flex gap-2 sm:gap-3">
                    {/* Scientific Panel */}
                    {isScientific && (
                         <div className="grid grid-cols-3 gap-2 sm:gap-3 w-[75%] sm:w-auto">
                            <Button onClick={() => handleFunction('sin')} className={sciFuncBtn}>sin</Button>
                            <Button onClick={() => handleFunction('cos')} className={sciFuncBtn}>cos</Button>
                            <Button onClick={() => handleFunction('tan')} className={sciFuncBtn}>tan</Button>
                            
                            <Button onClick={() => handleFunction('ln')} className={sciFuncBtn}>ln</Button>
                            <Button onClick={() => handleFunction('log')} className={sciFuncBtn}>log</Button>
                            <Button onClick={() => handleInput('π')} className={sciFuncBtn}>π</Button>
                            
                            <Button onClick={() => handleInput('(')} className={sciFuncBtn}>(</Button>
                            <Button onClick={() => handleInput(')')} className={sciFuncBtn}>)</Button>
                            <Button onClick={() => handleFunction('√')} className={sciFuncBtn}>√</Button>
                            
                            <Button onClick={handleSquare} className={sciFuncBtn}>x²</Button>
                            <Button onClick={() => handleInput('^')} className={sciFuncBtn}>xʸ</Button>
                            <Button onClick={() => { triggerSound(); setAngleMode(p => p === 'deg' ? 'rad' : 'deg'); }} className={angleToggleBtn}>{angleMode.toUpperCase()}</Button>
                         </div>
                    )}

                    {/* Standard Panel */}
                    <div className={`grid grid-cols-4 gap-2 sm:gap-3 ${isScientific ? 'flex-1' : 'w-full'}`}>
                        <Button onClick={clearAll} className={specialFuncBtn}>AC</Button>
                        <Button onClick={backspace} className={specialFuncBtn}><BackspaceIcon /></Button>
                        <Button onClick={handleToggleScientific} className={specialFuncBtn}>{isScientific ? 'std' : 'sci'}</Button>
                        <Button onClick={() => handleInput('÷')} className={opBtn}>&divide;</Button>

                        <Button onClick={() => handleInput('7')} className={numBtn}>7</Button>
                        <Button onClick={() => handleInput('8')} className={numBtn}>8</Button>
                        <Button onClick={() => handleInput('9')} className={numBtn}>9</Button>
                        <Button onClick={() => handleInput('×')} className={opBtn}>&times;</Button>
                        
                        <Button onClick={() => handleInput('4')} className={numBtn}>4</Button>
                        <Button onClick={() => handleInput('5')} className={numBtn}>5</Button>
                        <Button onClick={() => handleInput('6')} className={numBtn}>6</Button>
                        <Button onClick={() => handleInput('−')} className={opBtn}>&minus;</Button>
                        
                        <Button onClick={() => handleInput('1')} className={numBtn}>1</Button>
                        <Button onClick={() => handleInput('2')} className={numBtn}>2</Button>
                        <Button onClick={() => handleInput('3')} className={numBtn}>3</Button>
                        <Button onClick={() => handleInput('+')} className={opBtn}>+</Button>

                        <Button onClick={handleToggleSign} className={numBtn}>+/-</Button>
                        <Button onClick={() => handleInput('0')} className={numBtn}>0</Button>
                        <Button onClick={handleDot} className={numBtn}>.</Button>
                        <Button onClick={calculateResult} className={opBtn}>=</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StandardCalculator;
