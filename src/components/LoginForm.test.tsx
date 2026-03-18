import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from './LoginForm';
import { supabase } from '@/lib/supabase';
import { expect, test, vi } from 'vitest';

// Mock useRouter
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

// Mock Supabase Auth
vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
        },
    },
}));

test('renders login form and handles submission', async () => {
    render(<LoginForm />);

    // Verify UI elements
    expect(screen.getByLabelText(/Mã nhân viên \/ Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Truy cập hệ thống/i })).toBeInTheDocument();

    // Mock successful login
    (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
        data: { user: { id: 'test-user' } },
        error: null,
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/Mã nhân viên \/ Username/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Truy cập hệ thống/i }));

    // Wait for auth call
    await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
        });
    });
});

test('shows error message on failed login', async () => {
    render(<LoginForm />);

    // Mock failed login
    (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Thông tin đăng nhập không hợp lệ' },
    });

    fireEvent.change(screen.getByLabelText(/Mã nhân viên \/ Username/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Truy cập hệ thống/i }));

    await waitFor(() => {
        expect(screen.getByText(/Thông tin đăng nhập không hợp lệ/i)).toBeInTheDocument();
    });
});
