import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
    offer: any;
    iceCandidates: any[];
    answer?: any;
    answerCandidates?: any[];
    createdAt: Date;
}

const RoomSchema = new Schema<IRoom>({
    offer: Schema.Types.Mixed,
    iceCandidates: [Schema.Types.Mixed],
    answer: Schema.Types.Mixed,
    answerCandidates: [Schema.Types.Mixed],
    createdAt: { type: Date, default: Date.now, expires: 1800 }, // Auto-delete after 30 mins
});

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
