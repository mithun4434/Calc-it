import React from 'react';

interface HistoryPanelProps {
    history: string[];
    onSelectHistory: (value: string) => void;
    onClearHistory: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelectHistory, onClearHistory }) => {
    return (
        <div className="absolute inset-0 bg-zinc-100 dark:bg-black z-10 rounded-2xl flex flex-col p-3 transition-all duration-300">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-black dark:text-white">History</h3>
                <button
                    onClick={onClearHistory}
                    className="text-sm font-semibold text-black dark:text-white px-3 py-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    disabled={history.length === 0}
                >
                    Clear
                </button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                {history.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-zinc-500 dark:text-zinc-400">No calculations yet.</p>
                    </div>
                ) : (
                    <ul className="space-y-2 text-right">
                        {history.map((item, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => {
                                        const result = item.split(' = ')[1];
                                        if (result !== undefined) {
                                            onSelectHistory(result);
                                        }
                                    }}
                                    className="w-full text-left p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <p className="text-zinc-500 dark:text-zinc-400 text-sm truncate">{item.split(' = ')[0]} =</p>
                                    <p className="text-black dark:text-white text-2xl font-semibold">{item.split(' = ')[1]}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default HistoryPanel;
