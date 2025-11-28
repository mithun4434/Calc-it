
// Fix: Added the missing 'InputMode' type definition.
export type InputMode = 'text' | 'upload' | 'camera';

export type CalculatorMode = 'standard' | 'integration' | 'differentiation' | 'matrix' | 'partialDerivative' | 'temperatureConverter' | 'moneyConverter' | 'mit';

export type SoundId = 'mute' | 'click' | 'mechanical' | 'blip' | 'retro' | 'water' | 'laser' | 'typewriter' | 'wood' | 'glass' | 'pop';

export interface Solution {
  answer: string;
  steps: string[];
  calculationSteps?: string[];
  matrixAnswer?: number[][];
  scalarAnswer?: number;
}
