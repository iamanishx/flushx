import { NextRequest, NextResponse } from 'next/server';
import { roomStorage } from '@/lib/storage';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { answer, iceCandidates } = await request.json();

        if (!answer || !iceCandidates) {
            return NextResponse.json(
                { error: 'Missing answer or ICE candidates' },
                { status: 400 }
            );
        }

        const success = await roomStorage.addAnswer(id, answer, iceCandidates);

        if (!success) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding answer:', error);
        return NextResponse.json(
            { error: 'Failed to add answer' },
            { status: 500 }
        );
    }
}
