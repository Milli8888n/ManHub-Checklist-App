import { expect, test, vi } from 'vitest';
import { supabase } from './supabase';

vi.mock('@supabase/ssr', () => ({
    createBrowserClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
        })),
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        }
    })),
}));

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
        })),
    })),
}));

test('supabase client is initialized', () => {
    expect(supabase).toBeDefined();
    expect(supabase.from).toBeTypeOf('function');
});
