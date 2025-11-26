import React from 'react';

interface ConnectionStatusProps {
    status: string;
    connectionState: string;
}

export function ConnectionStatus({ status, connectionState }: ConnectionStatusProps) {
    const getStatusColor = () => {
        switch (connectionState) {
            case 'connected': return 'bg-green-500';
            case 'connecting': return 'bg-amber-500';
            case 'failed': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="flex items-center justify-center gap-2.5 px-4 py-2 bg-gray-900 rounded-full border border-gray-800 w-fit mx-auto mb-6">
            <div className="relative flex h-2.5 w-2.5">
                {connectionState === 'connecting' && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor()}`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getStatusColor()}`}></span>
            </div>
            <span className="text-sm font-medium text-gray-300">{status}</span>
        </div>
    );
}
