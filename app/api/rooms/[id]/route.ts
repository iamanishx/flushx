import { NextRequest, NextResponse } from 'next/server';
import { roomStorage } from '@/lib/storage';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const room = await roomStorage.get(id);

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            offer: room.offer,
            iceCandidates: room.iceCandidates,
            answer: room.answer,
            answerCandidates: room.answerCandidates,
        });
    } catch (error) {
        console.error('Error getting room:', error);
        return NextResponse.json(
            { error: 'Failed to get room' },
            { status: 500 }
        );
    }
}
