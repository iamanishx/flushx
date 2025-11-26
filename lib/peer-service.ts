export class PeerService {
    private peer: RTCPeerConnection | null = null;
    private dataChannel: RTCDataChannel | null = null;
    private iceCandidates: RTCIceCandidateInit[] = [];

    private fileChunks: ArrayBuffer[] = [];
    private receivedSize = 0;
    private fileSize = 0;
    private fileName = '';
    public onFileProgress?: (progress: number) => void;
    public onFileReceived?: (file: File) => void;
    public onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    public onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
    public onDataChannelOpen?: () => void;

    async initialize(isOfferer: boolean): Promise<void> {
        const config: RTCConfiguration = {
            iceServers: [
                {
                    urls: [
                        'stun:stun1.l.google.com:19302',
                        'stun:stun2.l.google.com:19302',
                        'stun:stun.cloudflare.com:3478',
                    ],
                },
            ],
            iceCandidatePoolSize: 10,
        };
        this.peer = new RTCPeerConnection(config);
        this.setupPeerEvents();
        if (isOfferer) {
            this.createDataChannel();
        } else {
            this.peer.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannelEvents();
            };
        }
    }

    private setupPeerEvents(): void {
        if (!this.peer) return;
        this.peer.onicecandidate = (event) => {
            if (event.candidate) {
                this.iceCandidates.push(event.candidate.toJSON());
                this.onIceCandidate?.(event.candidate.toJSON());
            }
        };
        this.peer.onconnectionstatechange = () => {
            this.onConnectionStateChange?.(this.peer!.connectionState);
        };
    }

    private createDataChannel(): void {
        if (!this.peer) return;
        this.dataChannel = this.peer.createDataChannel('fileTransfer', {
            ordered: true,
        });
        this.setupDataChannelEvents();
    }

    private setupDataChannelEvents(): void {
        if (!this.dataChannel) return;
        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
            this.onDataChannelOpen?.();
        };
        this.dataChannel.onmessage = (event) => {
            if (typeof event.data === 'string') {
                const metadata = JSON.parse(event.data);
                this.fileName = metadata.fileName;
                this.fileSize = metadata.fileSize;
                this.receivedSize = 0;
                this.fileChunks = [];
            } else {
                this.fileChunks.push(event.data);
                this.receivedSize += event.data.byteLength;
                const progress = (this.receivedSize / this.fileSize) * 100;
                this.onFileProgress?.(progress);
                if (this.receivedSize === this.fileSize) {
                    this.assembleFile();
                }
            }
        };
    }

    private assembleFile(): void {
        const blob = new Blob(this.fileChunks);
        const file = new File([blob], this.fileName);
        this.onFileReceived?.(file);
        this.fileChunks = [];
        this.receivedSize = 0;
    }

    async sendFile(file: File): Promise<void> {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            throw new Error('Data channel not ready');
        }
        const metadata = {
            fileName: file.name,
            fileSize: file.size,
        };
        this.dataChannel.send(JSON.stringify(metadata));
        const chunkSize = 16384;
        let offset = 0;
        const readChunk = async (): Promise<void> => {
            const chunk = file.slice(offset, offset + chunkSize);
            const buffer = await chunk.arrayBuffer();

            this.dataChannel!.send(buffer);
            offset += buffer.byteLength;
            const progress = (offset / file.size) * 100;
            this.onFileProgress?.(progress);
            if (offset < file.size) {
                setTimeout(readChunk, 0); // Non-blocking
            }
        };
        await readChunk();
    }

    async createOffer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peer) throw new Error('Peer not initialized');

        const offer = await this.peer.createOffer();
        await this.peer.setLocalDescription(offer);
        return offer;
    }

    async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
        if (!this.peer) throw new Error('Peer not initialized');

        await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(answer);
        return answer;
    }

    async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peer) throw new Error('Peer not initialized');
        await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.peer) throw new Error('Peer not initialized');
        await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
    }

    getIceCandidates(): RTCIceCandidateInit[] {
        return this.iceCandidates;
    }

    cleanup(): void {
        this.dataChannel?.close();
        this.peer?.close();
        this.dataChannel = null;
        this.peer = null;
        this.iceCandidates = [];
    }
}
