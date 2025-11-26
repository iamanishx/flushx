import { NextRequest, NextResponse } from 'next/server';
import { roomStorage } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        const { offer, iceCandidates } = await request.json();

        if (!offer || !iceCandidates) {
            return NextResponse.json(
                { error: 'Missing offer or ICE candidates' },
                { status: 400 }
            );
        }

        const roomId = await roomStorage.create(offer, iceCandidates);
        return NextResponse.json({ roomId });
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json(
            { error: 'Failed to create room' },
            { status: 500 }
        );
    }
}
