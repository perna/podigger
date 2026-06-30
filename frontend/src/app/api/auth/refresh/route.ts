import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000';

export async function POST(request: NextRequest) {
    const refreshToken = request.cookies.get('refresh_token');

    if (!refreshToken) {
        return NextResponse.json(
            { detail: 'Refresh token ausente.' },
            { status: 401 },
        );
    }

    let backendResponse: Response;

    try {
        backendResponse = await fetch(`${BACKEND_URL}/api/auth/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `refresh_token=${refreshToken.value}`,
            },
        });
    } catch {
        return NextResponse.json(
            { detail: 'Serviço indisponível. Tente novamente.' },
            { status: 503 },
        );
    }

    if (backendResponse.status === 401) {
        const errorBody = await backendResponse.json().catch(() => ({}));
        return NextResponse.json(errorBody, { status: 401 });
    }

    if (backendResponse.ok) {
        const nextResponse = NextResponse.json({}, { status: 200 });

        // Forward the new access_token Set-Cookie header from the backend
        const setCookieHeaders = backendResponse.headers.getSetCookie
            ? backendResponse.headers.getSetCookie()
            : [];

        if (setCookieHeaders.length === 0) {
            const rawSetCookie = backendResponse.headers.get('set-cookie');
            if (rawSetCookie) {
                nextResponse.headers.append('Set-Cookie', rawSetCookie);
            }
        } else {
            for (const cookie of setCookieHeaders) {
                nextResponse.headers.append('Set-Cookie', cookie);
            }
        }

        return nextResponse;
    }

    const fallbackBody = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(fallbackBody, { status: backendResponse.status });
}
