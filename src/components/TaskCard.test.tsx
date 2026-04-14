import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from './TaskCard';
import { expect, test, vi, beforeEach } from 'vitest';

beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn(() => true));
});

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

test('triggers file picker if photo required and pending', async () => {
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
    const clickSpy = vi.spyOn(input, 'click');

    // Click on the card
    fireEvent.click(screen.getByText(/Clean Table/i).closest('div')!);

    expect(clickSpy).toHaveBeenCalled();
});

test('submits task directly if NO photo required and confirmed', async () => {
    const onSubmit = vi.fn();
    render(
        <TaskCard
            id="2"
            title="Simple Task"
            description="No photo needed"
            status="pending"
            isPhotoRequired={false}
            area="Cafe"
            userRole="staff"
            onSubmit={onSubmit}
        />
    );

    // Click on the card
    fireEvent.click(screen.getByText(/Simple Task/i).closest('div')!);

    expect(window.confirm).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledWith('2', '');
});
