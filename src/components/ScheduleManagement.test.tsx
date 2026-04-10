import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScheduleManagement from './ScheduleManagement';
import { supabase } from '@/lib/supabase';
import { expect, test, vi, describe, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                or: vi.fn(() => ({
                    order: vi.fn(() => Promise.resolve({
                        data: [
                            { id: '1', full_name: 'BBR001', username: 'bbr001', role: 'staff' },
                            { id: '2', full_name: 'BBR002', username: 'bbr002', role: 'admin' }
                        ],
                        error: null
                    }))
                })),
                gte: vi.fn(() => ({
                    lte: vi.fn(() => Promise.resolve({
                        data: [
                            { id: '100', user_id: '1', date: '2026-04-03', shift: 'Ca 1' }
                        ],
                        error: null
                    }))
                })),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({
                        data: { id: '101', user_id: '1', date: '2026-04-04', shift: 'Ca 2' },
                        error: null
                    }))
                }))
            })),
            update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
            delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
            upsert: vi.fn(() => Promise.resolve({ error: null })),
        })),
    },
}));

vi.stubGlobal('confirm', vi.fn(() => true));
vi.stubGlobal('alert', vi.fn());

describe('ScheduleManagement Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders successfully and loads initial data', async () => {
        render(<ScheduleManagement userRole="admin" currentUserId="1" />);

        expect(screen.getByText(/Lịch Tuần/i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getAllByText(/BBR001/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/BBR002/i).length).toBeGreaterThan(0);
        });
    });

    test('allows clicking empty cell as admin to create a shift', async () => {
        const { container } = render(<ScheduleManagement userRole="admin" currentUserId="1" />);
        await waitFor(() => {
            expect(screen.getAllByText(/BBR001/i).length).toBeGreaterThan(0);
        });
        
        // Find a cell with "+"
        const emptyCells = screen.getAllByText('+');
        expect(emptyCells.length).toBeGreaterThan(0);
        
        fireEvent.click(emptyCells[0]);

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('work_schedules');
        });
    });

    test('handles copying schedule to next week', async () => {
        render(<ScheduleManagement userRole="admin" currentUserId="1" />);
        await waitFor(() => {
            expect(screen.getAllByText(/BBR001/i).length).toBeGreaterThan(0);
        });

        // Click S.Chép sang Tuần Sau
        const copyNextWeekBtn = screen.getByText(/S.Chép sang Tuần Sau/i);
        fireEvent.click(copyNextWeekBtn);

        expect(window.confirm).toHaveBeenCalled();
        
        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('work_schedules');
            expect(window.alert).toHaveBeenCalledWith('Đã sao chép lịch làm việc thành công!');
        });
    });

    test('handles copying schedule for next month', async () => {
        render(<ScheduleManagement userRole="admin" currentUserId="1" />);
        await waitFor(() => {
            expect(screen.getAllByText(/BBR001/i).length).toBeGreaterThan(0);
        });

        // Click S.Chép 1 Tháng Tới
        const copyNextMonthBtn = screen.getByText(/S.Chép 1 Tháng Tới/i);
        fireEvent.click(copyNextMonthBtn);

        expect(window.confirm).toHaveBeenCalled();
        
        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('work_schedules');
            expect(window.alert).toHaveBeenCalledWith('Đã sao chép lịch làm việc thành công!');
        });
    });

    test('disables admin features for normal staff', async () => {
        render(<ScheduleManagement userRole="staff" currentUserId="1" />);
        await waitFor(() => {
            expect(screen.getAllByText(/BBR001/i).length).toBeGreaterThan(0);
        });

        // Copy buttons should not exist
        expect(screen.queryByText(/S.Chép sang Tuần Sau/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/S.Chép 1 Tháng Tới/i)).not.toBeInTheDocument();
    });
});
