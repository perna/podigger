import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function POST(request: NextRequest) {
    let body: { email?: unknown; password?: unknown };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ detail: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    const { email, password } = body;

    let backendResponse: Response;

    try {
        backendResponse = await fetch(`${BACKEND_URL}/api/auth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
    } catch {
        return NextResponse.json(
            { detail: 'Serviço indisponível. Tente novamente.' },
            { status: 503 },
        );
    }

    // Forward 401/403 with the original backend body
    if (backendResponse.status === 401 || backendResponse.status === 403) {
        const errorBody = await backendResponse.json().catch(() => ({}));
        return NextResponse.json(errorBody, { status: backendResponse.status });
    }

    // On success, forward Set-Cookie headers and return { role, email }
    if (backendResponse.ok) {
        const responseBody = await backendResponse.json();

        const nextResponse = NextResponse.json(
            { role: responseBody.role, email: responseBody.email },
            { status: 200 },
        );

        // Forward all Set-Cookie headers from the backend to the browser
        const setCookieHeaders = backendResponse.headers.getSetCookie
            ? backendResponse.headers.getSetCookie()
            : [];

        // Fallback for environments where getSetCookie is not available
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

    // Any other unexpected status — forward as-is
    const fallbackBody = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(fallbackBody, { status: backendResponse.status });
}
