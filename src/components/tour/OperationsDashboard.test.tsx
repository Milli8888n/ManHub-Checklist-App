import { render, screen, waitFor } from '@testing-library/react';
import OperationsDashboard from './OperationsDashboard';
import { supabase } from '@/lib/supabase';
import { expect, test, vi, describe, beforeEach, afterEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
    const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null })),
        then: vi.fn().mockImplementation((onSuccess) => onSuccess({ data: [], error: null })),
    };
    
    return {
        supabase: {
            auth: { getUser: vi.fn() },
            from: vi.fn(() => mockQuery),
            channel: vi.fn(() => ({
                on: vi.fn().mockReturnThis(),
                subscribe: vi.fn(),
            })),
            removeChannel: vi.fn(),
        }
    };
});

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

vi.mock('./SeatMap', () => ({
    default: () => <div data-testid="mock-seatmap">Mock SeatMap</div>,
}));

describe('OperationsDashboard Component - Role Based Flow', () => {
    let mockRole = 'staff';
    let mockBarbers = [
        { 
            user_id: 'barber-1', 
            state: 'available', 
            last_completed_at: '2026-04-03T09:00:00Z',
            users: { full_name: 'Phong Barber', username: 'phong' } 
        }
    ];
    let mockSchedule = [{ user_id: 'barber-1', shift: 'Ca 1' }];

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock current time to 10:00 AM without using fake timers (less invasive)
        const RealDate = Date;
        global.Date = class extends RealDate {
            constructor() {
                super();
                return new RealDate('2026-04-03T10:00:00Z');
            }
        } as any;

        const mockResponse = (table: string) => {
            if (table === 'users') return { data: { role: mockRole }, error: null };
            if (table === 'barber_status') return { data: mockBarbers, error: null };
            if (table === 'work_schedules') return { data: mockSchedule, error: null };
            if (table === 'service_sessions') return { data: [], error: null };
            return { data: [], error: null };
        };

        (supabase.from as any).mockImplementation((table: string) => {
            const data = (table === 'users') ? { role: mockRole } :
                         (table === 'barber_status') ? mockBarbers :
                         (table === 'work_schedules') ? mockSchedule : 
                         (table === 'service_sessions') ? [] : [];
            
            const chain: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                single: vi.fn(() => Promise.resolve({ data, error: null })),
                then: (onSuccess: any) => Promise.resolve({ data, error: null }).then(onSuccess)
            };
            return chain;
        });

        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'any-user-id' } } });
    });

    afterEach(() => {
        // Restore Date
        vi.useRealTimers();
    });

    test('Staff role sees barbers but NO assign button', async () => {
        mockRole = 'staff';
        render(<OperationsDashboard />);

        // Increase timeout for waitFor
        await waitFor(() => {
            expect(screen.getByText(/Phong Barber/i)).toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.queryByText(/GÁN KHÁCH/i)).not.toBeInTheDocument();
    });

    test('Admin role sees the GÁN KHÁCH (ADMIN) button', async () => {
        mockRole = 'admin';
        render(<OperationsDashboard />);

        await waitFor(() => {
            expect(screen.getByText(/GÁN KHÁCH \(ADMIN\)/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    test('Shows appropriate message when no barbers are in shift', async () => {
         mockRole = 'admin';
         // Mock an empty schedule for this test
         const originalSchedule = mockSchedule;
         mockSchedule = [];

         render(<OperationsDashboard />);

         await waitFor(() => {
            expect(screen.getByText(/Hiện không có thợ trong ca trực/i)).toBeInTheDocument();
         }, { timeout: 3000 });

         mockSchedule = originalSchedule;
    });

    test('renders history log section title', async () => {
        render(<OperationsDashboard />);
        await waitFor(() => {
            expect(screen.getByText(/Lịch sử phục vụ hôm nay/i)).toBeInTheDocument();
        });
    });
});
