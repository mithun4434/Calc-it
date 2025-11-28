import React from 'react';
import ClearIcon from './icons/ClearIcon';

interface InputWrapperProps {
    children: React.ReactElement<HTMLInputElement | HTMLTextAreaElement>;
    value: string | number;
    onClear: () => void;
    disabled?: boolean;
    className?: string;
}

const InputWrapper: React.FC<InputWrapperProps> = ({ children, value, onClear, disabled, className }) => {
    const hasValue = value !== '' && value !== 0;

    return (
        <div className={`relative group ${className || ''}`}>
            {children}
            {hasValue && !disabled && (
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/10 dark:bg-white/10 text-current opacity-0 group-hover:opacity-70 group-focus-within:opacity-70 hover:!opacity-100 focus:!opacity-100 transition-opacity"
                    aria-label="Clear input"
                >
                    <ClearIcon />
                </button>
            )}
        </div>
    );
};

export default InputWrapper;
