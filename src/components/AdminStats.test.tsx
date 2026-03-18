import { render, screen } from '@testing-library/react';
import AdminStats from './AdminStats';
import { expect, test } from 'vitest';

test('renders admin stats correctly', () => {
    render(
        <AdminStats
            totalTasks={10}
            completedTasks={5}
            photoTasks={2}
            photoCompleted={1}
        />
    );

    // Check for completion rate
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Check for completed counts
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/\/10/)).toBeInTheDocument();

    // Check for photo counts
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/\/2/)).toBeInTheDocument();
});

test('handles zero tasks gracefully', () => {
    render(
        <AdminStats
            totalTasks={0}
            completedTasks={0}
            photoTasks={0}
            photoCompleted={0}
        />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
});
