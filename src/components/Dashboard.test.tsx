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
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn((table) => {
            if (table === 'daily_task_logs') {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => Promise.resolve({
                            data: [
                                {
                                    id: 'log-1',
                                    status: 'pending',
                                    task_definitions: {
                                        title: 'Task 1',
                                        area: 'Cafe',
                                        description: 'Desc',
                                        is_photo_required: false,
                                        shift: 'all',
                                        required_role: 'staff'
                                    }
                                }
                            ],
                            error: null
                        })),
                    })),
                    update: vi.fn(() => ({
                        eq: vi.fn(() => Promise.resolve({ error: null })),
                    })),
                };
            }
            if (table === 'users') {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            single: vi.fn(() => Promise.resolve({ data: { role: 'admin' }, error: null }))
                        }))
                    }))
                };
            }
            if (table === 'task_definitions') {
                return {
                    select: vi.fn(() => ({
                        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
                    }))
                };
            }
            return {
                select: vi.fn(() => ({
                    order: vi.fn(() => Promise.resolve({ data: [], error: null }))
                }))
            };
        }),
        auth: {
            signOut: vi.fn(),
            getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null })),
        }
    },
}));

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
