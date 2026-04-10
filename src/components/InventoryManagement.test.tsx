import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InventoryManagement from './InventoryManagement';
import { supabase } from '@/lib/supabase';
import { expect, test, vi, describe, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
    const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null })),
        then: vi.fn().mockImplementation((onSuccess) => onSuccess({ 
            data: [
                { id: '1', name: 'Test Product', quantity: 10, min_quantity: 5, category: 'tool', unit: 'cái', is_active: true }
            ], 
            error: null 
        })),
    };
    
    return {
        supabase: {
            from: vi.fn((table) => {
                if (table === 'inventory_logs') {
                    return {
                        ...mockQuery,
                        then: vi.fn((onSuccess) => onSuccess({
                            data: [
                                { id: '101', action: 'import', quantity_change: 1, quantity_after: 11, created_at: new Date().toISOString(), item_id: '1', inventory_items: { name: 'Test Product' }, users: { full_name: 'Admin' } }
                            ],
                            error: null
                        }))
                    };
                }
                return mockQuery;
            }),
            auth: {
                getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'admin-id' } }, error: null })),
            }
        }
    };
});

describe('InventoryManagement Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders inventory list and stats', async () => {
        render(<InventoryManagement userRole="admin" currentUserId="admin-id" />);

        await waitFor(() => {
            expect(screen.getByText(/Quản lý Tồn kho/i)).toBeInTheDocument();
            expect(screen.getByText('Test Product')).toBeInTheDocument();
            expect(screen.getByText('10')).toBeInTheDocument();
        });
    });

    test('opens add modal when clicking "Thêm sản phẩm"', async () => {
        render(<InventoryManagement userRole="admin" currentUserId="admin-id" />);
        
        await waitFor(() => {
            expect(screen.getByText(/Thêm sản phẩm/i)).toBeInTheDocument();
        });

        const addBtn = screen.getByText(/Thêm sản phẩm/i);
        fireEvent.click(addBtn);

        expect(screen.getByText(/📦 Thêm sản phẩm/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/VD: Sáp vuốt tóc.../i)).toBeInTheDocument();
    });

    test('switches to history view', async () => {
        render(<InventoryManagement userRole="admin" currentUserId="admin-id" />);
        
        const historyTab = await screen.findByText(/Lịch sử/i);
        fireEvent.click(historyTab);

        await waitFor(() => {
            expect(screen.getByText(/Nhập kho/i)).toBeInTheDocument();
            expect(screen.getByText(/Admin/i)).toBeInTheDocument();
        });
    });

    test('filters items by search query', async () => {
        render(<InventoryManagement userRole="admin" currentUserId="admin-id" />);
        
        const searchInput = await screen.findByPlaceholderText(/Tìm kiếm.../i);
        
        await waitFor(() => {
            expect(screen.getByText(/Test Product/i)).toBeInTheDocument();
        });

        fireEvent.change(searchInput, { target: { value: 'None' } });
        
        await waitFor(() => {
            expect(screen.queryByText(/Test Product/i)).not.toBeInTheDocument();
        });
    });
});
