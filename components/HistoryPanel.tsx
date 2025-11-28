import React from 'react';

interface HistoryPanelProps {
    history: string[];
    onSelectHistory: (value: string) => void;
    onClearHistory: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelectHistory, onClearHistory }) => {
    return (
        <div className="glass-panel absolute inset-0 z-10 flex flex-col p-3 rounded-3xl history-panel-enter">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold">History</h3>
                <button
                    onClick={onClearHistory}
                    className="text-sm font-semibold px-3 py-1 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                    disabled={history.length === 0}
                >
                    Clear
                </button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                {history.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="opacity-60">No calculations yet.</p>
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
                                    className="w-full text-left p-2 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                >
                                    <p className="opacity-60 text-sm truncate">{item.split(' = ')[0]} =</p>
                                    <p className="text-2xl font-semibold">{item.split(' = ')[1]}</p>
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