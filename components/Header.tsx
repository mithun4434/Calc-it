
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center">
            <div className="flex items-center justify-center gap-3">
                <h1 className="text-4xl sm:text-5xl font-bold text-white">
                    AI Smart Calculator
                </h1>
            </div>
            <p className="mt-3 text-lg text-zinc-400">
                A basic calculator with an AI-powered math solver.
            </p>
        </header>
    );
};

export default Header;
