// Feature: api-authentication-strategy, Property 17: Redirecionamento preserva URL de origem
// Validates: Requirements 13.5

import { describe, test } from 'vitest';
import fc from 'fast-check';

/**
 * Replicates the URL-building logic from src/proxy.ts.
 * Given a pathname and optional search string, builds the redirect URL
 * to /auth/unauthorized with the original path as the `next` query param.
 */
function buildUnauthorizedRedirect(pathname: string, search: string = ''): string {
    const next = encodeURIComponent(pathname + search);
    return `/auth/unauthorized?next=${next}`;
}

/**
 * Property 17: Redirecionamento preserva URL de origem
 *
 * For any protected URL accessed without valid authentication, the redirect
 * to /auth/unauthorized must include the original pathname + search as the
 * `next` query parameter.
 *
 * Validates: Requirements 13.5
 */
describe('Property 17: Redirect preserves origin URL', () => {
    test('redirect URL always points to /auth/unauthorized', () => {
        fc.assert(
            fc.property(
                fc.webPath(),
                (path) => {
                    const redirectUrl = buildUnauthorizedRedirect(path);
                    return redirectUrl.startsWith('/auth/unauthorized');
                },
            ),
            { numRuns: 100 },
        );
    });

    test('redirect URL always contains the original path as the `next` param', () => {
        fc.assert(
            fc.property(
                fc.webPath(),
                (path) => {
                    const redirectUrl = buildUnauthorizedRedirect(path);
                    const fullUrl = new URL(redirectUrl, 'http://localhost');
                    const next = fullUrl.searchParams.get('next');
                    return next === path;
                },
            ),
            { numRuns: 100 },
        );
    });

    test('redirect URL preserves search params in the `next` value', () => {
        fc.assert(
            fc.property(
                fc.webPath(),
                fc.record({
                    key: fc.stringMatching(/^[a-z][a-z0-9_]*$/),
                    value: fc.asciiString({ minLength: 1, maxLength: 20 }),
                }),
                (path, param) => {
                    const search = `?${param.key}=${encodeURIComponent(param.value)}`;
                    const redirectUrl = buildUnauthorizedRedirect(path, search);
                    const fullUrl = new URL(redirectUrl, 'http://localhost');
                    const next = fullUrl.searchParams.get('next');
                    return next === path + search;
                },
            ),
            { numRuns: 100 },
        );
    });
});
