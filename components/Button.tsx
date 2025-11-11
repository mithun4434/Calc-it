import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
    return (
        <button
            {...props}
            className={`flex items-center justify-center font-semibold rounded-3xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-gray-400 ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;