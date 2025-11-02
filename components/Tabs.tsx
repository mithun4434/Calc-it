
import React from 'react';
import { InputMode } from '../types';
import TextIcon from './icons/TextIcon';
import UploadIcon from './icons/UploadIcon';
import CameraIcon from './icons/CameraIcon';

interface TabsProps {
    currentMode: InputMode;
    setMode: (mode: InputMode) => void;
}

const TabButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500
                ${isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};


const Tabs: React.FC<TabsProps> = ({ currentMode, setMode }) => {
    return (
        <div className="flex space-x-2 bg-gray-900/50 p-1.5 rounded-lg">
            <TabButton
                label="Text"
                icon={<TextIcon />}
                isActive={currentMode === 'text'}
                onClick={() => setMode('text')}
            />
            <TabButton
                label="Upload"
                icon={<UploadIcon />}
                isActive={currentMode === 'upload'}
                onClick={() => setMode('upload')}
            />
            <TabButton
                label="Camera"
                icon={<CameraIcon />}
                isActive={currentMode === 'camera'}
                onClick={() => setMode('camera')}
            />
        </div>
    );
};

export default Tabs;
