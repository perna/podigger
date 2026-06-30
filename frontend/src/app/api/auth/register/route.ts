import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000';

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
        backendResponse = await fetch(`${BACKEND_URL}/api/auth/register/`, {
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

    if (backendResponse.status === 201) {
        const responseBody = await backendResponse.json().catch(() => ({}));
        return NextResponse.json(responseBody, { status: 201 });
    }

    if (backendResponse.status === 400) {
        const errorBody = await backendResponse.json().catch(() => ({}));
        return NextResponse.json(errorBody, { status: 400 });
    }

    // Any other unexpected status — forward as-is
    const fallbackBody = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(fallbackBody, { status: backendResponse.status });
}
