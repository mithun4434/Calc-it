import React, { useState, useCallback } from 'react';
import { getCurrencyExchangeRate } from '../../services/geminiService';
import Spinner from '../Spinner';
import InputWrapper from '../InputWrapper';

const currencies = [
    "USD", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD", "MXN", "SGD", "HKD", "NOK", "KRW", "TRY", "INR", "RUB", "BRL", "ZAR"
];

const MoneyConverter: React.FC = () => {
    const [amount, setAmount] = useState('100');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [result, setResult] = useState<{ convertedAmount: number, exchangeRate: number, disclaimer: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || fromCurrency === toCurrency) {
            setError("Please enter a valid amount and select two different currencies.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await getCurrencyExchangeRate(numAmount, fromCurrency, toCurrency);
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch conversion rate.");
        } finally {
            setIsLoading(false);
        }
    }, [amount, fromCurrency, toCurrency]);
    
    const inputClasses = "w-full p-3 bg-black/10 dark:bg-black/20 border border-current/10 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors";
    const selectClasses = `${inputClasses} appearance-none`;

    return (
        <div className="glass-panel w-full max-w-sm mx-auto p-4 sm:p-6 space-y-6 rounded-3xl">
            <h2 className="text-2xl font-bold text-center">Currency Converter</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="sm:col-span-1">
                         <label htmlFor="amount" className="block text-sm font-medium opacity-70 mb-1">Amount</label>
                        <InputWrapper value={amount} onClear={() => setAmount('')}>
                            <input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className={inputClasses} />
                        </InputWrapper>
                    </div>
                     <div className="sm:col-span-1">
                         <label htmlFor="from" className="block text-sm font-medium opacity-70 mb-1">From</label>
                         <select id="from" value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} className={selectClasses}>
                            {currencies.map(c => <option key={c} value={c} className="bg-gray-200 dark:bg-gray-900">{c}</option>)}
                         </select>
                     </div>
                     <div className="sm:col-span-1">
                         <label htmlFor="to" className="block text-sm font-medium opacity-70 mb-1">To</label>
                         <select id="to" value={toCurrency} onChange={e => setToCurrency(e.target.value)} className={selectClasses}>
                            {currencies.map(c => <option key={c} value={c} className="bg-gray-200 dark:bg-gray-900">{c}</option>)}
                         </select>
                     </div>
                </div>
                 <button
                    type="submit"
                    className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? <Spinner /> : 'Convert'}
                </button>
            </form>

            {(isLoading || error || result) && (
                 <div className="p-2 border-t border-current/10">
                    {error && !isLoading && (
                        <div className="text-center mt-4 p-4 bg-red-500/10 dark:bg-red-900/50 border border-red-500/50 rounded-3xl">
                            <h3 className="font-bold text-lg mb-2 text-red-700 dark:text-red-300">Error</h3>
                            <p className="opacity-90">{error}</p>
                        </div>
                    )}
                    {result && !isLoading && (
                        <div className="mt-4 text-center p-4 bg-gray-500/10 dark:bg-gray-500/20 border border-gray-500/30 rounded-3xl space-y-2">
                            <p className="text-lg opacity-80">{amount} {fromCurrency} =</p>
                            <p className="text-4xl font-bold">{result.convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurrency}</p>
                            <p className="text-sm opacity-60">1 {fromCurrency} = {result.exchangeRate.toFixed(4)} {toCurrency}</p>
                            <p className="text-xs opacity-50 pt-2">{result.disclaimer}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MoneyConverter;