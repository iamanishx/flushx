import React from 'react';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
    disabled?: boolean;
}

export function FileUploader({ onFileSelect, selectedFile, disabled }: FileUploaderProps) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileSelect(file);
    };

    return (
        <div className="mb-8 w-full">
            <label className={`group flex flex-col items-center justify-center w-full h-64 border border-dashed rounded-lg cursor-pointer transition-all duration-200 ${disabled
                    ? 'border-gray-800 bg-gray-900/50 cursor-not-allowed opacity-50'
                    : 'border-gray-700 hover:border-white hover:bg-gray-900'
                }`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className={`p-4 rounded-full mb-4 transition-colors ${disabled ? 'bg-gray-800' : 'bg-gray-900 group-hover:bg-gray-800'
                        }`}>
                        <svg
                            className={`w-8 h-8 ${disabled ? 'text-gray-600' : 'text-gray-400 group-hover:text-white'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>
                    <p className={`mb-2 text-sm ${disabled ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-300'}`}>
                        <span className="font-semibold text-white">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">Any file up to 1GB</p>
                    {selectedFile && (
                        <div className="mt-4 px-4 py-2 bg-white/10 rounded-full text-sm text-white font-medium flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {selectedFile.name}
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={disabled}
                />
            </label>
        </div>
    );
}
