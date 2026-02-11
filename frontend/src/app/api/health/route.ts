import { NextResponse } from 'next/server';

export async function GET() {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    };

    return NextResponse.json(health, { status: 200 });
}
