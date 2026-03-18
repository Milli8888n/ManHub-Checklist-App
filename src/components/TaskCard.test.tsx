import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from './TaskCard';
import { expect, test, vi } from 'vitest';

test('renders pending task', () => {
    render(
        <TaskCard
            id="1"
            title="Clean Table"
            description="Use cloth"
            area="Cafe"
            status="pending"
            isPhotoRequired={false}
            userRole="staff"
        />
    );

    expect(screen.getByText(/Clean Table/i)).toBeInTheDocument();
});

test('renders completed task with green styles', () => {
    render(
        <TaskCard
            id="1"
            title="Clean Table"
            description="Use cloth"
            area="Cafe"
            status="completed"
            isPhotoRequired={false}
            userRole="admin"
        />
    );

    const title = screen.getByText(/Clean Table/i);
    expect(title).toHaveClass('text-green-400');
});

test('triggers file picker if photo required and pending', () => {
    const onUpload = vi.fn();

    const { container } = render(
        <TaskCard
            id="1"
            title="Clean Table"
            description="Lau bàn với khăn sạch"
            status="pending"
            isPhotoRequired={true}
            area="Cafe"
            userRole="staff"
            onUpload={onUpload}
        />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.accept).toBe('image/*');
});
