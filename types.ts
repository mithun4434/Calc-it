// Fix: Added the missing 'InputMode' type definition.
export type InputMode = 'text' | 'upload' | 'camera';

export interface Solution {
  answer: string;
  steps: string[];
}
