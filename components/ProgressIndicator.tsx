import React from 'react';
import Spinner from './Spinner';
import CheckIcon from './icons/CheckIcon';

type ProgressStep = 'analyzing' | 'solving';

interface ProgressIndicatorProps {
    currentStep: ProgressStep;
    hasImage: boolean;
}

const Step: React.FC<{ title: string; status: 'completed' | 'active' | 'pending' }> = ({ title, status }) => {
    const baseClasses = "flex items-center gap-2 p-3 rounded-2xl transition-all duration-300";
    const statusClasses = {
        completed: 'bg-green-500/20 dark:bg-green-500/30 text-green-800 dark:text-green-300',
        active: 'bg-black/10 dark:bg-white/10',
        pending: 'bg-black/5 dark:bg-black/20 opacity-50'
    };

    return (
        <div className={`${baseClasses} ${statusClasses[status]}`}>
            {status === 'active' && <Spinner />}
            {status === 'completed' && <CheckIcon className="w-5 h-5" />}
            {status === 'pending' && <div className="w-5 h-5 border-2 border-current rounded-full" />}
            <span className="font-semibold">{title}</span>
        </div>
    );
};

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, hasImage }) => {
    if (!hasImage) {
        return (
            <div className="flex flex-col items-center justify-center text-center">
                <Spinner />
                <p className="mt-4 opacity-70">AI is solving the problem...</p>
            </div>
        );
    }
    
    const analyzeStatus = currentStep === 'analyzing' ? 'active' : 'completed';
    const solveStatus = currentStep === 'solving' ? 'active' : (currentStep === 'analyzing' ? 'pending' : 'completed');

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold opacity-60 uppercase tracking-wider text-center">Progress</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
                <Step 
                    title="Analyze Image" 
                    status={analyzeStatus}
                />
                <div className="w-8 h-px sm:w-px sm:h-8 bg-current/20" />
                <Step 
                    title="Solve Problem" 
                    status={solveStatus}
                />
            </div>
        </div>
    );
};

export default ProgressIndicator;