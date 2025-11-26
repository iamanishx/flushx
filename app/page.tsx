'use client';

import { useState, useEffect } from 'react';
import { PeerService } from '@/lib/peer-service';
import { FileUploader } from '@/components/FileUploader';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { TransferProgress } from '@/components/TransferProgress';

export default function Home() {
  const [peer] = useState(() => new PeerService());
  const [file, setFile] = useState<File | null>(null);
  const [shareLink, setShareLink] = useState<string>('');
  const [status, setStatus] = useState<string>('Select a file to share');
  const [progress, setProgress] = useState<number>(0);
  const [connectionState, setConnectionState] = useState<string>('new');

  useEffect(() => {
    peer.onConnectionStateChange = (state) => {
      setConnectionState(state);
      if (state === 'connected') {
        setStatus('Connected! Preparing to send...');
      }
    };
    peer.onFileProgress = (prog) => {
      setProgress(prog);
    };
    peer.onDataChannelOpen = () => {
      setStatus('Data channel ready! Sending file...');
      if (file) {
        setTimeout(() => {
          peer.sendFile(file).catch(err => {
            console.error('Send file error:', err);
            setStatus('Error sending file');
          });
        }, 100);
      }
    };

    return () => {
      peer.cleanup();
    };
  }, [peer, file]);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus('Initializing...');

    try {
      // Initialize peer connection
      await peer.initialize(true);

      // Create offer
      const offer = await peer.createOffer();
      const iceCandidates = peer.getIceCandidates();

      // Wait a bit for ICE candidates
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create room
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer,
          iceCandidates: peer.getIceCandidates(),
        }),
      });

      const { roomId } = await response.json();
      const link = `${window.location.origin}/share/${roomId}`;
      setShareLink(link);
      setStatus('Share the link below');

      // Poll for answer
      pollForAnswer(roomId);
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error creating share link');
    }
  };

  const pollForAnswer = async (roomId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        const data = await response.json();

        if (data.answer) {
          clearInterval(interval);
          await peer.setRemoteAnswer(data.answer);

          // Add answer ICE candidates
          for (const candidate of data.answerCandidates || []) {
            await peer.addIceCandidate(candidate);
          }

          setStatus('Connected! Waiting for data channel...');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold tracking-tight mb-3 text-white">
          FlushX
        </h1>
        <p className="text-gray-400 text-sm">
          Secure, direct, peer-to-peer transfer.
        </p>
      </div>

      <div className="bg-black border border-gray-800 rounded-2xl p-6 shadow-2xl shadow-purple-900/10">
        <ConnectionStatus status={status} connectionState={connectionState} />

        <FileUploader
          onFileSelect={handleFileSelect}
          selectedFile={file}
          disabled={!!shareLink}
        />

        {progress > 0 && (
          <TransferProgress progress={progress} status={progress === 100 ? 'Sent!' : 'Sending...'} />
        )}

        {shareLink && (
          <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">Share Link</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-900 rounded-lg border border-gray-800 text-sm text-gray-300 outline-none focus:border-white transition-colors font-mono"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareLink)}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
