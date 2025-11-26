import React from 'react';

interface TransferProgressProps {
    progress: number;
    status: string;
}

export function TransferProgress({ progress, status }: TransferProgressProps) {
    return (
        <div className="w-full mb-6">
            <div className="flex justify-between text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
                <span>{status}</span>
                <span>{Math.round(progress)}%</span>
            </div>

            <div className="w-full bg-gray-900 rounded-full h-1 overflow-hidden">
                <div
                    className="bg-white h-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
