import dbConnect from './db';
import Room from '@/models/Room';

export const roomStorage = {
    async create(offer: RTCSessionDescriptionInit, iceCandidates: RTCIceCandidateInit[]): Promise<string> {
        await dbConnect();
        const room = await Room.create({
            offer,
            iceCandidates,
        });
        return room._id.toString();
    },

    async get(roomId: string) {
        await dbConnect();
        try {
            const room = await Room.findById(roomId);
            if (!room) return null;
            return {
                offer: room.offer,
                iceCandidates: room.iceCandidates,
                answer: room.answer,
                answerCandidates: room.answerCandidates,
            };
        } catch (error) {
            return null;
        }
    },

    async addAnswer(roomId: string, answer: RTCSessionDescriptionInit, candidates: RTCIceCandidateInit[]): Promise<boolean> {
        await dbConnect();
        try {
            const room = await Room.findByIdAndUpdate(roomId, {
                answer,
                answerCandidates: candidates,
            });
            return !!room;
        } catch (error) {
            return false;
        }
    }
};
