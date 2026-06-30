import '@testing-library/jest-dom/vitest';

process.env.NEXT_PUBLIC_API_URL ??= 'http://localhost:8000';
process.env.NODE_ENV ??= 'test';
