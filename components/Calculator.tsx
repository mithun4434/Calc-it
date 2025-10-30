import React, { useState } from 'react';
import Button from './Button';
import SparklesIcon from './icons/SparklesIcon';

interface CalculatorProps {
    onOpenSolver: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ onOpenSolver }) => {
    const [displayValue, setDisplayValue] = useState('0');
    const [firstOperand, setFirstOperand] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
    
    const inputDigit = (digit: string) => {
        if (waitingForSecondOperand) {
            setDisplayValue(digit);
            setWaitingForSecondOperand(false);
        } else {
            setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
        }
    };

    const inputDecimal = () => {
        if (waitingForSecondOperand) {
            setDisplayValue('0.');
            setWaitingForSecondOperand(false);
            return;
        }
        if (!displayValue.includes('.')) {
            setDisplayValue(displayValue + '.');
        }
    };
    
    const clearAll = () => {
        setDisplayValue('0');
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(false);
    };

    const handleOperator = (nextOperator: string) => {
        const inputValue = parseFloat(displayValue);

        if (operator && !waitingForSecondOperand) {
            if (firstOperand === null) {
                setFirstOperand(inputValue);
            } else {
                 const result = performCalculation();
                 setDisplayValue(String(result));
                 setFirstOperand(result);
            }
        } else {
            setFirstOperand(inputValue);
        }

        setWaitingForSecondOperand(true);
        setOperator(nextOperator);
    };

    const performCalculation = () => {
        if (operator && firstOperand !== null) {
            const currentValue = parseFloat(displayValue);
            const calculations: { [key: string]: (a: number, b: number) => number } = {
                '/': (a, b) => a / b,
                '*': (a, b) => a * b,
                '-': (a, b) => a - b,
                '+': (a, b) => a + b,
            };
            const result = calculations[operator](firstOperand, currentValue);
            return result;
        }
        return parseFloat(displayValue);
    };
    
    const handleEquals = () => {
        if (!operator || firstOperand === null) return;
        const result = performCalculation();
        setDisplayValue(String(result));
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(false);
    };

    const renderDisplay = () => {
        if (operator && waitingForSecondOperand) {
            return `${firstOperand} ${operator.replace('*', '×').replace('/', '÷')}`;
        }
        if (firstOperand !== null && operator && !waitingForSecondOperand) {
            return `${firstOperand} ${operator.replace('*', '×').replace('/', '÷')} ${displayValue}`;
        }
        return displayValue;
    };


    return (
        <div className="w-full max-w-sm mx-auto bg-black rounded-3xl p-4 shadow-2xl border border-zinc-800 space-y-4">
            {/* Display */}
            <div className="bg-black text-white text-7xl text-right rounded-2xl p-6 overflow-x-auto break-all">
                {renderDisplay()}
            </div>

            {/* Buttons Grid */}
            <div className="grid grid-cols-4 gap-3">
                <Button onClick={onOpenSolver} className="col-span-2 bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center gap-2">
                    <SparklesIcon /> <span className="text-2xl">AI Solver</span>
                </Button>
                <Button onClick={clearAll} className="bg-zinc-800 hover:bg-zinc-700 text-white">AC</Button>
                <Button onClick={() => handleOperator('/')} className="bg-zinc-300 hover:bg-zinc-400 text-black">&divide;</Button>
                
                <Button onClick={() => inputDigit('7')} className="bg-zinc-800 hover:bg-zinc-700 text-white">7</Button>
                <Button onClick={() => inputDigit('8')} className="bg-zinc-800 hover:bg-zinc-700 text-white">8</Button>
                <Button onClick={() => inputDigit('9')} className="bg-zinc-800 hover:bg-zinc-700 text-white">9</Button>
                <Button onClick={() => handleOperator('*')} className="bg-zinc-300 hover:bg-zinc-400 text-black">&times;</Button>
                
                <Button onClick={() => inputDigit('4')} className="bg-zinc-800 hover:bg-zinc-700 text-white">4</Button>
                <Button onClick={() => inputDigit('5')} className="bg-zinc-800 hover:bg-zinc-700 text-white">5</Button>
                <Button onClick={() => inputDigit('6')} className="bg-zinc-800 hover:bg-zinc-700 text-white">6</Button>
                <Button onClick={() => handleOperator('-')} className="bg-zinc-300 hover:bg-zinc-400 text-black">&minus;</Button>
                
                <Button onClick={() => inputDigit('1')} className="bg-zinc-800 hover:bg-zinc-700 text-white">1</Button>
                <Button onClick={() => inputDigit('2')} className="bg-zinc-800 hover:bg-zinc-700 text-white">2</Button>
                <Button onClick={() => inputDigit('3')} className="bg-zinc-800 hover:bg-zinc-700 text-white">3</Button>
                <Button onClick={() => handleOperator('+')} className="bg-zinc-300 hover:bg-zinc-400 text-black">+</Button>
                
                <Button onClick={() => inputDigit('0')} className="col-span-2 bg-zinc-800 hover:bg-zinc-700 text-white">0</Button>
                <Button onClick={inputDecimal} className="bg-zinc-800 hover:bg-zinc-700 text-white">.</Button>
                <Button onClick={handleEquals} className="bg-zinc-300 hover:bg-zinc-400 text-black">=</Button>
            </div>
        </div>
    );
};

export default Calculator;