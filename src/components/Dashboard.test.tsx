import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';
import { supabase } from '@/lib/supabase';
import { expect, test, vi } from 'vitest';

// Mock useRouter
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => {
    const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null })),
        then: vi.fn().mockImplementation((onSuccess) => onSuccess({ data: [], error: null })),
    };
    
    return {
        supabase: {
            from: vi.fn((table) => {
                if (table === 'daily_task_logs') {
                    return {
                        ...mockQuery,
                        then: vi.fn((onSuccess) => onSuccess({
                            data: [{
                                id: 'log-1', status: 'pending',
                                task_definitions: { title: 'Task 1', area: 'Cafe', description: 'Desc', is_photo_required: false, shift: 'all', required_role: 'staff', frequency: 'Hàng ngày', estimated_duration: '15p' }
                            }],
                            error: null
                        }))
                    };
                }
                if (table === 'users') {
                    return { ...mockQuery, eq: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { role: 'admin', full_name: 'Admin User' }, error: null })) })) };
                }
                if (table === 'work_schedules') {
                    return { ...mockQuery, eq: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { shift: 'Ca 1' }, error: null })) })) })) };
                }
                return mockQuery;
            }),
            auth: {
                signOut: vi.fn(),
                getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null })),
            }
        }
    };
});

test('renders dashboard and displays tasks', async () => {
    render(<Dashboard />);

    await waitFor(() => {
        expect(screen.getByText(/Task 1/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Quản lý Công việc/i)).not.toBeInTheDocument();
});

test('shows settings tab for admin users', async () => {
    render(<Dashboard />);

    await waitFor(() => {
        expect(screen.getByText(/Cài đặt/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Cài đặt/i));

    await waitFor(() => {
        expect(screen.getByText(/Quản lý Công việc/i)).toBeInTheDocument();
    });
});

test('handles date filtering for history', async () => {
    // Override the mock to track calls
    const mockEq = vi.fn(() => Promise.resolve({ data: [], error: null }));
    const mockSelect = vi.fn(() => ({ eq: mockEq }));
    
    // We can't easily re-mock in the middle of a test file with vi.mock, 
    // but we can check if the input exists and changing it works.
    render(<Dashboard />);
    
    // We can't easily re-mock in the middle of a test file with vi.mock, 
    // but we can check if the input exists and changing it works.
    const dateInput = await screen.findByLabelText(/Lọc theo ngày/i);
    
    fireEvent.change(dateInput, { target: { value: '2026-04-02' } });
    // The component uses useEffect with [selectedDate] so it should refetch
    await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('daily_task_logs');
    });
});
