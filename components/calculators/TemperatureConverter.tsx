import React, { useState, ChangeEvent } from 'react';

const TemperatureConverter: React.FC = () => {
    const [values, setValues] = useState({ celsius: '', fahrenheit: '', kelvin: '' });

    const handleCelsiusChange = (e: ChangeEvent<HTMLInputElement>) => {
        const C = e.target.value;
        if (C === '' || C === '-') {
            setValues({ celsius: C, fahrenheit: '', kelvin: '' });
            return;
        }
        const numC = parseFloat(C);
        if (isNaN(numC)) return;
        
        setValues({
            celsius: C,
            fahrenheit: ((numC * 9/5) + 32).toFixed(2),
            kelvin: (numC + 273.15).toFixed(2),
        });
    };

    const handleFahrenheitChange = (e: ChangeEvent<HTMLInputElement>) => {
        const F = e.target.value;
        if (F === '' || F === '-') {
            setValues({ celsius: '', fahrenheit: F, kelvin: '' });
            return;
        }
        const numF = parseFloat(F);
        if (isNaN(numF)) return;
        
        const C = (numF - 32) * 5/9;
        setValues({
            celsius: C.toFixed(2),
            fahrenheit: F,
            kelvin: (C + 273.15).toFixed(2),
        });
    };
    
    const handleKelvinChange = (e: ChangeEvent<HTMLInputElement>) => {
        const K = e.target.value;
        if (K === '' || K === '-') {
            setValues({ celsius: '', fahrenheit: '', kelvin: K });
            return;
        }
        const numK = parseFloat(K);
        if (isNaN(numK)) return;

        const C = numK - 273.15;
        setValues({
            celsius: C.toFixed(2),
            fahrenheit: ((C * 9/5) + 32).toFixed(2),
            kelvin: K,
        });
    };

    const inputClasses = "w-full text-center p-3 bg-black/10 dark:bg-black/20 border border-current/10 rounded-3xl focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors placeholder:text-current placeholder:opacity-50 text-2xl";
    const labelClasses = "block text-center text-sm font-medium opacity-70 mb-2";

    return (
        <div className="glass-panel w-full max-w-sm mx-auto p-4 sm:p-6 space-y-6 rounded-3xl">
            <h2 className="text-2xl font-bold text-center">Temperature Converter</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="celsius" className={labelClasses}>Celsius (°C)</label>
                    <input id="celsius" type="number" value={values.celsius} onChange={handleCelsiusChange} className={inputClasses} placeholder="0"/>
                </div>
                <div>
                    <label htmlFor="fahrenheit" className={labelClasses}>Fahrenheit (°F)</label>
                    <input id="fahrenheit" type="number" value={values.fahrenheit} onChange={handleFahrenheitChange} className={inputClasses} placeholder="32"/>
                </div>
                <div>
                    <label htmlFor="kelvin" className={labelClasses}>Kelvin (K)</label>
                    <input id="kelvin" type="number" value={values.kelvin} onChange={handleKelvinChange} className={inputClasses} placeholder="273.15"/>
                </div>
            </div>
        </div>
    );
};

export default TemperatureConverter;