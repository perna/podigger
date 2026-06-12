// Bugfix: icon-font-not-loading
// Property 2: Preservation — Props do Icon e comportamento do layout preservados
// Validates: Requirements 3.1, 3.2

/**
 * Property 2: Preservation — Comportamento Existente Inalterado
 *
 * These tests capture the CURRENT (unfixed) baseline behavior that must be
 * preserved after the fix. They are written BEFORE the fix is applied.
 *
 * On UNFIXED code: tests PASS — confirming baseline behavior to preserve
 * After FIX:       tests PASS — confirming no regressions were introduced
 *
 * Validates: Requirements 3.1, 3.2
 */

import { describe, test, vi, beforeAll } from 'vitest';
import { expect } from 'vitest';
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

// Import components AFTER mocks are set up
import { Icon } from '@/components/ui/Icon';
import RootLayout from '@/app/layout';

describe('Property 2: Preservation — Comportamento Existente Inalterado', () => {
  /**
   * Property 2a — Icon Props (fontVariationSettings)
   *
   * For any combination of fill (boolean), weight (100–700, multiples of 100),
   * grade (-50–200), opticalSize (20–48), verify that the fontVariationSettings
   * generated is: 'FILL' ${fill?1:0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}
   *
   * Validates: Requirements 3.2
   */
  test("**Validates: Requirements 3.2** — fontVariationSettings reflete corretamente as props do Icon para qualquer combinação válida", () => {
    fc.assert(
      fc.property(
        fc.record({
          fill: fc.boolean(),
          weight: fc.constantFrom(100, 200, 300, 400, 500, 600, 700),
          grade: fc.integer({ min: -50, max: 200 }),
          opticalSize: fc.integer({ min: 20, max: 48 }),
        }),
        ({ fill, weight, grade, opticalSize }) => {
          const { container } = render(
            React.createElement(Icon, {
              name: 'tune',
              fill,
              weight,
              grade,
              opticalSize,
            })
          );

          const span = container.querySelector('span');
          expect(span).not.toBeNull();

          const expectedFontVariationSettings =
            `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`;

          expect(span!.style.fontVariationSettings).toBe(expectedFontVariationSettings);
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 2b — Icon Name
   *
   * For any string icon name, verify that:
   * - The <span> contains the name as text content
   * - The <span> has the class material-symbols-rounded
   *
   * Validates: Requirements 3.2
   */
  test("**Validates: Requirements 3.2** — span contém o nome do ícone como texto e tem a classe material-symbols-rounded", () => {
    fc.assert(
      fc.property(
        fc.constantFrom('tune', 'home', 'settings', 'trending_up', 'search', 'close', 'menu', 'keyboard_double_arrow_right'),
        (iconName) => {
          const { container } = render(
            React.createElement(Icon, { name: iconName })
          );

          const span = container.querySelector('span');
          expect(span).not.toBeNull();
          expect(span!.textContent).toBe(iconName);
          expect(span!.classList.contains('material-symbols-rounded')).toBe(true);
        },
      ),
      { numRuns: 20 },
    );
  });

  /**
   * Property 2c — Layout body
   *
   * Verify that the <body> of the layout contains the class for the
   * --font-jakarta variable (Plus Jakarta Sans).
   *
   * Validates: Requirements 3.1
   */
  test("**Validates: Requirements 3.1** — body do layout contém a classe da variável --font-jakarta (Plus Jakarta Sans)", () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          render(
            React.createElement(RootLayout, null, React.createElement('div', null, 'test content'))
          );

          const body = document.body;
          // The mock returns variable: '--font-jakarta', so jakarta.variable === '--font-jakarta'
          // The layout applies `${jakarta.variable}` as a class on <body>
          // This means the body should have '--font-jakarta' as a class
          expect(body.className).toContain('--font-jakarta');
        },
      ),
      { numRuns: 1 },
    );
  });
});
