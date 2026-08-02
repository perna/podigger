import '@testing-library/jest-dom/vitest';

process.env.NEXT_PUBLIC_API_URL ??= 'http://localhost:8000';
(process.env as Record<string, string | undefined>).NODE_ENV ??= 'test';
