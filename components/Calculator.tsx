import React from 'react';
import { CalculatorMode } from '../types';
import StandardCalculator from './calculators/StandardCalculator';
import IntegrationCalculator from './calculators/IntegrationCalculator';
import DifferentiationCalculator from './calculators/DifferentiationCalculator';
import MatrixCalculator from './calculators/MatrixCalculator';
import PartialDerivativeCalculator from './calculators/PartialDerivativeCalculator';
import TemperatureConverter from './calculators/TemperatureConverter';
import MoneyConverter from './calculators/MoneyConverter';
import MITChat from './calculators/ChatbotTeacher';


interface CalculatorProps {
    mode: CalculatorMode;
    onOpenSolver: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ mode, onOpenSolver }) => {
    switch (mode) {
        case 'integration':
            return <IntegrationCalculator />;
        case 'differentiation':
            return <DifferentiationCalculator />;
        case 'partialDerivative':
            return <PartialDerivativeCalculator />;
        case 'matrix':
            return <MatrixCalculator />;
        case 'temperatureConverter':
            return <TemperatureConverter />;
        case 'moneyConverter':
            return <MoneyConverter />;
        case 'mit':
            return <MITChat />;
        case 'standard':
        default:
            return <StandardCalculator onOpenSolver={onOpenSolver} />;
    }
};

export default Calculator;
