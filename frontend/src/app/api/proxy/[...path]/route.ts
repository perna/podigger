import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000';

type RouteContext = { params: Promise<{ path: string[] }> };

/**
 * Builds the backend URL from the catch-all path segments.
 * e.g. ["podcasts"] → "http://localhost:8000/api/podcasts/"
 * e.g. ["podcasts", "42"] → "http://localhost:8000/api/podcasts/42/"
 */
function buildBackendUrl(pathSegments: string[], searchParams: URLSearchParams): string {
    const joined = pathSegments.join('/');
    const base = `${BACKEND_URL}/api/${joined}/`;
    const qs = searchParams.toString();
    return qs ? `${base}?${qs}` : base;
}

/**
 * Forwards a request to the backend, injecting the access_token cookie.
 * The body must be pre-read as an ArrayBuffer to allow retries.
 */
async function forwardToBackend(
    request: NextRequest,
    backendUrl: string,
    accessToken: string | undefined,
    preReadBody: ArrayBuffer | null,
): Promise<Response> {
    const headers: Record<string, string> = {
        'Content-Type': request.headers.get('Content-Type') ?? 'application/json',
    };

    if (accessToken) {
        headers['Cookie'] = `access_token=${accessToken}`;
    }

    // Forward Accept header if present
    const accept = request.headers.get('Accept');
    if (accept) {
        headers['Accept'] = accept;
    }

    const method = request.method;
    const hasBody = method !== 'GET' && method !== 'HEAD';

    return fetch(backendUrl, {
        method,
        headers,
        body: hasBody && preReadBody ? preReadBody : undefined,
    });
}

/**
 * Attempts to refresh the access_token by calling the backend refresh endpoint
 * using the refresh_token cookie from the original request.
 * Returns the new access_token value if successful, or null if refresh failed.
 */
async function attemptRefresh(request: NextRequest): Promise<{ newToken: string; setCookieHeaders: string[] } | null> {
    const refreshToken = request.cookies.get('refresh_token');

    if (!refreshToken) {
        return null;
    }

    let refreshResponse: Response;

    try {
        refreshResponse = await fetch(`${BACKEND_URL}/api/auth/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `refresh_token=${refreshToken.value}`,
            },
        });
    } catch {
        return null;
    }

    if (!refreshResponse.ok) {
        return null;
    }

    // Extract the new access_token from Set-Cookie headers
    const setCookieHeaders: string[] = refreshResponse.headers.getSetCookie
        ? refreshResponse.headers.getSetCookie()
        : [];

    if (setCookieHeaders.length === 0) {
        const raw = refreshResponse.headers.get('set-cookie');
        if (raw) setCookieHeaders.push(raw);
    }

    // Parse the new access_token value from the Set-Cookie headers
    for (const header of setCookieHeaders) {
        const match = header.match(/^access_token=([^;]+)/);
        if (match) {
            return { newToken: match[1], setCookieHeaders };
        }
    }

    return null;
}

/**
 * Builds a redirect response to /auth/unauthorized with the original path as ?next=
 * and clears the auth cookies.
 */
function buildLogoutRedirect(pathSegments: string[]): NextResponse {
    const nextPath = `/api/${pathSegments.join('/')}/`;
    const redirectUrl = `/auth/unauthorized?next=${encodeURIComponent(nextPath)}`;

    const response = NextResponse.redirect(new URL(redirectUrl, 'http://localhost'), {
        status: 302,
    });

    // Clear auth cookies
    response.headers.append(
        'Set-Cookie',
        'access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    );
    response.headers.append(
        'Set-Cookie',
        'refresh_token=; Path=/api/auth/token/refresh/; HttpOnly; SameSite=Lax; Max-Age=0',
    );

    return response;
}

/**
 * Converts a backend Response into a NextResponse, forwarding status and body.
 * Optionally appends extra Set-Cookie headers (e.g. from a token refresh).
 */
async function buildProxyResponse(
    backendResponse: Response,
    extraSetCookieHeaders: string[] = [],
): Promise<NextResponse> {
    const contentType = backendResponse.headers.get('Content-Type') ?? '';
    const responseBody = await backendResponse.arrayBuffer();

    const nextResponse = new NextResponse(responseBody, {
        status: backendResponse.status,
        headers: {
            'Content-Type': contentType,
        },
    });

    for (const cookie of extraSetCookieHeaders) {
        nextResponse.headers.append('Set-Cookie', cookie);
    }

    return nextResponse;
}

/**
 * Core proxy handler shared by all HTTP methods.
 */
async function handleProxy(request: NextRequest, context: RouteContext): Promise<NextResponse> {
    const { path: pathSegments } = await context.params;
    const searchParams = new URL(request.url).searchParams;
    const backendUrl = buildBackendUrl(pathSegments, searchParams);

    const accessToken = request.cookies.get('access_token')?.value;

    // Pre-read the body once so it can be reused on retry (streams can only be consumed once)
    const method = request.method;
    const hasBody = method !== 'GET' && method !== 'HEAD';
    const requestBody: ArrayBuffer | null = hasBody ? await request.arrayBuffer() : null;

    // First attempt
    let backendResponse: Response;
    try {
        backendResponse = await forwardToBackend(request, backendUrl, accessToken, requestBody);
    } catch {
        return NextResponse.json(
            { detail: 'Serviço indisponível. Tente novamente.' },
            { status: 503 },
        );
    }

    // If not 401, forward the response as-is
    if (backendResponse.status !== 401) {
        return buildProxyResponse(backendResponse);
    }

    // Got 401 — attempt token refresh
    const refreshResult = await attemptRefresh(request);

    if (!refreshResult) {
        // Refresh failed — clear cookies and redirect to /auth/unauthorized
        return buildLogoutRedirect(pathSegments);
    }

    // Refresh succeeded — retry the original request with the new token
    let retryResponse: Response;
    try {
        retryResponse = await forwardToBackend(request, backendUrl, refreshResult.newToken, requestBody);
    } catch {
        return NextResponse.json(
            { detail: 'Serviço indisponível. Tente novamente.' },
            { status: 503 },
        );
    }

    // Forward the retry response and include the new access_token Set-Cookie
    return buildProxyResponse(retryResponse, refreshResult.setCookieHeaders);
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
    return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
    return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
    return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
    return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
    return handleProxy(request, context);
}
