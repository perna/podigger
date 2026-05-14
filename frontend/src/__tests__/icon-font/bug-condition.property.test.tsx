// Bugfix: icon-font-not-loading
// Property 1: Bug Condition — Material Symbols Rounded ausente no HTML do layout
// Validates: Requirements 1.1, 2.1, 2.2, 2.3

/**
 * Property 1: Bug Condition — Material Symbols Rounded ausente no HTML do layout
 *
 * This test encodes the EXPECTED (correct) behavior:
 * The Root Layout HTML MUST contain <link> tags for Material Symbols Rounded.
 *
 * On UNFIXED code: test FAILS — confirming the bug exists (font links are absent)
 * After FIX:       test PASSES — confirming the bug is resolved
 *
 * Validates: Requirements 1.1, 2.1, 2.2, 2.3
 */

import { describe, test, vi, beforeAll } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react';

// Mock window.matchMedia — not available in jsdom
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Mock next/font/google — uses Node.js internals not available in jsdom
vi.mock('next/font/google', () => ({
  Plus_Jakarta_Sans: () => ({
    variable: '--font-jakarta',
    className: 'plus-jakarta-sans',
  }),
}));

// Mock next/navigation — used by Navbar
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/link — simplify to a plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
}));

// Mock AuthContext — Navbar uses useAuth
vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useAuth: () => ({ isAuthenticated: false, user: null, logout: vi.fn() }),
}));

// Import RootLayout AFTER mocks are set up
import RootLayout from '@/app/layout';

describe('Property 1: Bug Condition — Material Symbols Rounded ausente no HTML do layout', () => {
  /**
   * Property 1a: HTML deve conter <link rel="stylesheet"> para fonts.googleapis.com
   * com Material+Symbols+Rounded
   *
   * On unfixed code: FAILS (link is absent — bug confirmed)
   * After fix: PASSES
   */
  test('HTML do layout contém <link rel="stylesheet"> para Material+Symbols+Rounded', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          render(
            React.createElement(RootLayout, null, React.createElement('div', null, 'test'))
          );

          // Check the full document HTML for the link tag
          const html = document.documentElement.outerHTML;

          const hasStylesheetLink =
            html.includes('fonts.googleapis.com') &&
            html.includes('Material+Symbols+Rounded') &&
            html.includes('rel="stylesheet"');

          return hasStylesheetLink;
        },
      ),
      { numRuns: 1 },
    );
  });

  /**
   * Property 1b: HTML deve conter <link rel="preconnect"> para fonts.googleapis.com
   *
   * On unfixed code: FAILS (preconnect link is absent — bug confirmed)
   * After fix: PASSES
   */
  test('HTML do layout contém <link rel="preconnect"> para fonts.googleapis.com', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          render(
            React.createElement(RootLayout, null, React.createElement('div', null, 'test'))
          );

          const html = document.documentElement.outerHTML;

          const hasPreconnectLink =
            html.includes('fonts.googleapis.com') &&
            html.includes('rel="preconnect"');

          return hasPreconnectLink;
        },
      ),
      { numRuns: 1 },
    );
  });
});
