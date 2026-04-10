import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffManagement from './StaffManagement';
import { supabase } from '@/lib/supabase';
import { expect, test, vi, describe, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                    data: [
                        { id: '1', full_name: 'BBR001', username: 'bbr001', role: 'staff', department: 'barber' },
                        { id: '2', full_name: 'BBR002', username: 'bbr002', role: 'admin', department: 'barber' }
                    ],
                    error: null
                }))
            })),
            insert: vi.fn(() => Promise.resolve({ error: null })),
            update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
            delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
        })),
    },
}));

vi.stubGlobal('confirm', vi.fn(() => true));
vi.stubGlobal('alert', vi.fn());

describe('StaffManagement Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders successfully and loads user data', async () => {
        render(<StaffManagement />);

        expect(screen.getByText(/Quản lý Nhân Sự/i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getAllByText(/BBR001/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/BBR002/i).length).toBeGreaterThan(0);
        });
    });

    test('filters users by search query', async () => {
        render(<StaffManagement />);
        
        await waitFor(() => {
            expect(screen.getAllByText(/BBR001/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/BBR002/i).length).toBeGreaterThan(0);
        });

        const searchInput = screen.getByPlaceholderText(/Tìm tên hoặc mã NV.../i);
        fireEvent.change(searchInput, { target: { value: 'BBR002' } });

        expect(screen.getAllByText(/BBR002/i).length).toBeGreaterThan(0);
        expect(screen.queryByText('bbr001')).not.toBeInTheDocument();
    });

    test('opens modal to add new staff and handles save', async () => {
        render(<StaffManagement />);
        
        await waitFor(() => {
            expect(screen.getAllByText(/BBR001/i).length).toBeGreaterThan(0);
        });

        fireEvent.click(screen.getByText(/Thêm Mới/i));
        expect(screen.getByText(/Thêm Mới Nhân Sự/i)).toBeInTheDocument();

        const nameInput = screen.getByPlaceholderText(/Nguyễn Văn A/i);
        const usernameInput = screen.getByPlaceholderText(/VD: bbr011/i);
        const pwInput = screen.getByPlaceholderText(/Bắt buộc nhập Mk/i);

        fireEvent.change(nameInput, { target: { value: 'New Staff' } });
        fireEvent.change(usernameInput, { target: { value: 'newstaff123' } });
        fireEvent.change(pwInput, { target: { value: 'password123' } });

        fireEvent.click(screen.getByText(/Lưu Lại/i));

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('users');
            expect(window.alert).toHaveBeenCalledWith('Thêm nhân sự thành công!');
        });
    });

    test('handles editing an existing staff member', async () => {
        render(<StaffManagement />);
        
        await waitFor(() => {
            expect(screen.getAllByText(/BBR001/i).length).toBeGreaterThan(0);
        });

        const editBtns = screen.getAllByTitle(/Sửa/i);
        fireEvent.click(editBtns[0]); // Click Edit for BBR001

        expect(screen.getByText(/Chỉnh Sửa Nhân Sự/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Lưu Lại/i));

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('users');
            expect(window.alert).toHaveBeenCalledWith('Cập nhật nhân sự thành công!');
        });
    });

    test('handles soft-locking/deleting staff', async () => {
        render(<StaffManagement />);
        
        await waitFor(() => {
            expect(screen.getAllByText(/BBR001/i).length).toBeGreaterThan(0);
        });

        const deleteBtns = screen.getAllByTitle(/Xóa/i);
        fireEvent.click(deleteBtns[0]);

        expect(window.confirm).toHaveBeenCalled();
        
        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('users');
        });
    });
});
