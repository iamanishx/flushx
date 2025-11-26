'use client';

import { useState, useEffect, use } from 'react';
import { PeerService } from '@/lib/peer-service';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { TransferProgress } from '@/components/TransferProgress';

export default function ReceivePage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);

    const [peer] = useState(() => new PeerService());
    const [status, setStatus] = useState<string>('Connecting...');
    const [progress, setProgress] = useState<number>(0);
    const [receivedFile, setReceivedFile] = useState<File | null>(null);
    const [connectionState, setConnectionState] = useState<string>('new');
    const [downloadReady, setDownloadReady] = useState<{ url: string; filename: string } | null>(null);

    useEffect(() => {
        connectToPeer();

        peer.onConnectionStateChange = (state) => {
            setConnectionState(state);
            if (state === 'connected') {
                setStatus('Connected! Waiting for file...');
            }
        };

        peer.onFileProgress = (prog) => {
            setProgress(prog);
            setStatus(`Receiving file...`);
        };

        peer.onFileReceived = (file) => {
            setReceivedFile(file);
            setStatus('File received!');

            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;

            document.body.appendChild(a);
            a.style.display = 'none';

            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

            if (isIOS) {
                setDownloadReady({ url, filename: file.name });
            } else {
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        };

        return () => {
            peer.cleanup();
        };
    }, []);

    const connectToPeer = async () => {
        try {
            const response = await fetch(`/api/rooms/${roomId}`);
            const data = await response.json();

            if (!data.offer) {
                setStatus('Invalid room or expired');
                return;
            }

            // Initialize peer
            await peer.initialize(false);

            // Create answer
            const answer = await peer.createAnswer(data.offer);

            // Wait for ICE candidates
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Submit answer
            await fetch(`/api/rooms/${roomId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answer,
                    iceCandidates: peer.getIceCandidates(),
                }),
            });

            // Add offer ICE candidates
            for (const candidate of data.iceCandidates || []) {
                await peer.addIceCandidate(candidate);
            }

        } catch (error) {
            console.error('Connection error:', error);
            setStatus('Connection failed');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-bold tracking-tight mb-3 text-white">
                    Receive File
                </h1>
                <p className="text-gray-400 text-sm">
                    Secure, direct, peer-to-peer transfer.
                </p>
            </div>

            <div className="bg-black border border-gray-800 rounded-2xl p-6 shadow-2xl shadow-blue-900/10">
                <div className="mb-6 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-1">Room ID</p>
                    <p className="font-mono text-gray-300 bg-gray-900 px-2 py-1 rounded inline-block">{roomId}</p>
                </div>

                <ConnectionStatus status={status} connectionState={connectionState} />

                {progress > 0 && progress < 100 && (
                    <TransferProgress progress={progress} status="Receiving..." />
                )}

                {receivedFile && (
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-green-900/30 mt-6 flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0 border border-green-500/20">
                            <svg
                                className="w-5 h-5 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-medium text-gray-200 truncate text-sm">
                                {receivedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {(receivedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </div>
                )}

                {downloadReady && (
                    <a
                        href={downloadReady.url}
                        download={downloadReady.filename}
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-blue-500/20 shadow-lg shadow-blue-900/20"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Tap to Download {downloadReady.filename}
                    </a>
                )}
            </div>
        </div>
    );
}
