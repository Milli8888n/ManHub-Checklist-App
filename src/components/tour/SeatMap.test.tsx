import { expect, vi, describe, beforeEach, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock queue algorithm
vi.mock('@/lib/queue-algorithm', () => ({
    isShiftActive: vi.fn(() => true),
    getShiftFromTime: vi.fn(() => 'Full'),
    calculatePriorityScore: vi.fn(() => 100)
}));

// Mock Supabase with nested join data and fixed TypeScript types
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn((table) => {
            const chain = {
                select: vi.fn(() => chain),
                eq: vi.fn(() => chain),
                order: vi.fn(() => {
                    if (table === 'barber_status') {
                        return Promise.resolve({
                            data: [
                                { 
                                    user_id: '1', 
                                    state: 'available', 
                                    station_label: 'Station 1', 
                                    users: { full_name: 'Nguyễn Phong' },
                                    current_session_id: null
                                },
                                { 
                                    user_id: '2', 
                                    state: 'busy', 
                                    station_label: 'Station 2', 
                                    users: { full_name: 'Trần Hải' },
                                    current_session_id: 'sess1'
                                }
                            ]
                        });
                    }
                    if (table === 'bookings') return Promise.resolve({ data: [] });
                    return Promise.resolve({ data: [] });
                }),
                gte: vi.fn(() => chain),
                lt: vi.fn(() => chain),
                in: vi.fn(() => Promise.resolve({ data: [] })),
                single: vi.fn().mockResolvedValue({ data: null }),
                // Fix: Explicitly type the 'resolve' parameter to avoid TS error
                then: (resolve: (value: any) => void) => {
                   if (table === 'work_schedules') {
                       return resolve({
                           data: [
                               { user_id: '1', shift: 'Full' },
                               { user_id: '2', shift: 'Full' }
                           ]
                       });
                   }
                   return resolve({ data: [] });
                }
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

import SeatMap from './SeatMap';

describe('SeatMap Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render loading state or stations initially', async () => {
        render(<SeatMap />);

        // Wait for fetch and verify elements
        await waitFor(() => {
            expect(screen.getByText('SƠ ĐỒ GHẾ TRỰC TIẾP')).toBeInTheDocument();
        }, { timeout: 4000 });

        expect(screen.getByText('Rảnh')).toBeInTheDocument();
        expect(screen.getByText('Đang làm')).toBeInTheDocument();

        // Verify mock data rendered (Check for last names as per component logic)
        expect(await screen.findByText('Phong')).toBeInTheDocument();
        expect(screen.getByText('Station 1')).toBeInTheDocument();
        expect(screen.getByText('Sẵn sàng')).toBeInTheDocument();
        
        expect(screen.getByText('Hải')).toBeInTheDocument();
        expect(screen.getByText('Station 2')).toBeInTheDocument();
        expect(screen.getByText('busy')).toBeInTheDocument();
    });
});
