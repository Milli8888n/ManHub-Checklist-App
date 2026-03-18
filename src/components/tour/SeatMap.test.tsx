import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SeatMap from './SeatMap';
import React from 'react';

// Mock Supabase
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockGte = vi.fn();
const mockLt = vi.fn();
const mockIn = vi.fn();

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn((table) => {
            const chain = {
                select: vi.fn(() => chain),
                order: vi.fn((column) => {
                    if (table === 'barber_status') return Promise.resolve({
                        data: [
                            { user_id: '1', state: 'available', station_label: 'Chair 1', users: { full_name: 'Barber A' } },
                            { user_id: '2', state: 'busy', station_label: 'Chair 2', users: { full_name: 'Barber B' }, current_session_id: 'sess1' }
                        ]
                    });
                    if (table === 'bookings') return Promise.resolve({ data: [] });
                    return Promise.resolve({ data: [] });
                }),
                gte: vi.fn(() => chain),
                lt: vi.fn(() => chain),
                in: vi.fn(() => Promise.resolve({ data: [] })),
                single: vi.fn().mockResolvedValue({ data: null })
            };
            return chain;
        }),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
        })),
        removeChannel: vi.fn()
    }
}));

import { supabase } from '@/lib/supabase';

describe('SeatMap Component', () => {
    it('should render loading state or stations initially', async () => {
        render(<SeatMap />);

        // Check for static elements
        expect(screen.getByText('Live Seat Map')).toBeInTheDocument();

        // Wait for fetch
        await waitFor(() => {
            expect(screen.getByText('A')).toBeInTheDocument();
            expect(screen.getByText('B')).toBeInTheDocument();
        }, { timeout: 4000 });

        // Check Status
        expect(screen.getByText('available')).toBeInTheDocument();
        expect(screen.getByText('busy')).toBeInTheDocument();
    });
});
