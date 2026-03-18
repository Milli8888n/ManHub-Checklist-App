import { expect, test, vi } from 'vitest';
import { middleware } from './middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock Supabase SSR
vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        },
    })),
}));

test('middleware redirects unauthenticated user to /login', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/'));
    const response = await middleware(request);

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe('http://localhost:3000/login');
});

test('middleware allows authenticated user to access dashboard', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    (createServerClient as any).mockReturnValueOnce({
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: { id: '123' } }, error: null })),
        },
        cookies: { getAll: vi.fn(), setAll: vi.fn() }
    });

    const request = new NextRequest(new URL('http://localhost:3000/'));
    const response = await middleware(request);

    // Status 200 means it continues (NextResponse.next())
    expect(response?.status).toBe(200);
});
