import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskManagement from './TaskManagement';
import { supabase } from '@/lib/supabase';
import { expect, test, vi } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                    data: [
                        { id: '1', title: 'Task A', area: 'Cafe', description: 'Desc A', is_photo_required: false, shift: 'all', required_role: 'staff' }
                    ],
                    error: null
                })),
            })),
            insert: vi.fn(() => Promise.resolve({ error: null })),
            update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
            delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
        })),
    },
}));

// Mock window.confirm
vi.stubGlobal('confirm', vi.fn(() => true));

test('renders task management and displays list', async () => {
    render(<TaskManagement userRole="admin" userDepartment={null} />);

    await waitFor(() => {
        expect(screen.getByText(/Task A/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Thêm công việc/i)).toBeInTheDocument();
});

test('opens add form and handles create', async () => {
    render(<TaskManagement userRole="admin" userDepartment={null} />);

    await waitFor(() => {
        expect(screen.getByText(/Thêm công việc/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Thêm công việc/i));

    expect(screen.getByText(/Tên công việc/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/VD: Lau sạch bụi bàn ghế/i), { target: { value: 'New Task' } });
    fireEvent.click(screen.getByText(/Lưu thay đổi/i));

    await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('task_definitions');
    });
});

test('handles task deletion', async () => {
    render(<TaskManagement userRole="admin" userDepartment={null} />);

    await waitFor(() => {
        expect(screen.getByText(/Task A/i)).toBeInTheDocument();
    });

    const deleteBtn = screen.getByLabelText(/Xóa/i);
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
});
