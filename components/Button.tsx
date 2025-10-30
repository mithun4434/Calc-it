
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
    return (
        <button
            {...props}
            className={`font-semibold rounded-2xl text-3xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-zinc-400 transition-colors duration-150 active:bg-opacity-80 ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
