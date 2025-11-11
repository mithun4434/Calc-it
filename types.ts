// Fix: Added the missing 'InputMode' type definition.
export type InputMode = 'text' | 'upload' | 'camera';

export type CalculatorMode = 'standard' | 'integration' | 'differentiation' | 'matrix' | 'partialDerivative' | 'temperatureConverter' | 'moneyConverter' | 'chatbotTeacher';

export interface Solution {
  answer: string;
  steps: string[];
  calculationSteps?: string[];
  matrixAnswer?: number[][];
  scalarAnswer?: number;
}