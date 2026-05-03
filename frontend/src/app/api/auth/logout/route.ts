import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true }, { status: 200 });

    // Delete access_token cookie by setting Max-Age=0
    response.headers.append(
        'Set-Cookie',
        'access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    );

    // Delete refresh_token cookie by setting Max-Age=0
    response.headers.append(
        'Set-Cookie',
        'refresh_token=; Path=/api/auth/token/refresh/; HttpOnly; SameSite=Lax; Max-Age=0',
    );

    return response;
}
