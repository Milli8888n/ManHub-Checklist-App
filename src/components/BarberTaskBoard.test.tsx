import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BarberTaskBoard from './BarberTaskBoard';
import { supabase } from '@/lib/supabase';
import { expect, test, vi, describe, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
    const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null })),
        then: vi.fn().mockImplementation((onSuccess) => onSuccess({ 
            data: [
                { id: '1', title: 'Test Task', status: 'pending', priority: 'medium', assigned_to: 'user-1' }
            ], 
            error: null 
        })),
    };
    
    return {
        supabase: {
            from: vi.fn((table) => {
                if (table === 'users') {
                    return {
                        ...mockQuery,
                        then: vi.fn((onSuccess) => onSuccess({ data: [{ id: 'user-1', full_name: 'BBR 01' }], error: null }))
                    };
                }
                return mockQuery;
            }),
            auth: {
                getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'admin-id' } }, error: null })),
            },
            update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
            insert: vi.fn(() => Promise.resolve({ error: null })),
            channel: vi.fn(() => ({
                on: vi.fn().mockReturnThis(),
                subscribe: vi.fn(),
                removeChannel: vi.fn()
            })),
            removeChannel: vi.fn()
        }
    };
});

describe('BarberTaskBoard Component', () => {
    test('renders board and fetches tasks', async () => {
        render(<BarberTaskBoard userRole="admin" currentUserId="admin-id" />);
        
        await waitFor(() => {
            expect(screen.getByText(/Nhiệm vụ hôm nay/i)).toBeInTheDocument();
            expect(screen.getByText('Test Task')).toBeInTheDocument();
        });
    });

    test('opens creation modal for admin', async () => {
        render(<BarberTaskBoard userRole="admin" currentUserId="admin-id" />);
        
        await waitFor(() => {
            expect(screen.getByText(/Nhiệm vụ hôm nay/i)).toBeInTheDocument();
        });

        const addBtn = screen.getByText(/Giao việc/i);
        fireEvent.click(addBtn);

        expect(screen.getByText(/📋 Giao việc mới/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/VD: Dọn kho, xếp hàng hóa.../i)).toBeInTheDocument();
    });

    test('date change triggers refetch', async () => {
        render(<BarberTaskBoard userRole="admin" currentUserId="admin-id" />);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue(new Date().toISOString().split('T')[0])).toBeInTheDocument();
        });

        const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
        fireEvent.change(dateInput, { target: { value: '2026-04-02' } });

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('barber_tasks');
        });
    });
});
