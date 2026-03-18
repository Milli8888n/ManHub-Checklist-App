import { describe, it, expect } from 'vitest';
import { calculatePriorityScore, sortBarbers } from './queue-algorithm';
import { Database } from './database.types';

type BarberStatus = Database['public']['Tables']['barber_status']['Row'] & {
    users: {
        full_name: string | null;
        username: string | null;
    } | null;
};

describe('Queue Algorithm (The Algorithm)', () => {

    it('should assign infinite priority score if barber was never completed', () => {
        const score = calculatePriorityScore(null);
        expect(score).toBeGreaterThan(1000); // Very high score
    });

    it('should calculate specific waiting time score', () => {
        const now = 1000000;
        const lastCompleted = new Date(now - 60000).toISOString(); // 1 min ago
        // Wait time = 60000ms. Weight = 1.0 (Walk-in)
        // Score = 60000
        const score = calculatePriorityScore(lastCompleted, 'walk_in', now);
        expect(score).toBe(60000);
    });

    it('should penalize booking history with lower priority (lower specific score)', () => {
        const now = 1000000;
        const lastCompleted = new Date(now - 60000).toISOString(); // 1 min ago

        const scoreWalkIn = calculatePriorityScore(lastCompleted, 'walk_in', now);
        const scoreBooking = calculatePriorityScore(lastCompleted, 'booking', now);

        // Booking weight is 1.2, so Score = WaitTime / 1.2
        // WalkIn weight is 1.0, so Score = WaitTime / 1.0
        // WalkIn > Booking (Higher score = Higher priority? Wait. 
        // Let's re-read logic: "Higher score = Higher priority".
        // Priority = Wait Time. The longer you wait, the higher the priority.
        // If Booking penalty exists, they should appear to have waited LESS than they actually did?
        // WaitTime / 1.2 < WaitTime. Correct. 

        expect(scoreBooking).toBeLessThan(scoreWalkIn);
    });

    it('should sort barbers: Available first, then by Longest Wait Time', () => {
        const now = new Date();
        const tenMinsAgo = new Date(now.getTime() - 10 * 60000).toISOString();
        const fiveMinsAgo = new Date(now.getTime() - 5 * 60000).toISOString();

        const barbers: BarberStatus[] = [
            { user_id: '1', state: 'busy', last_completed_at: null, check_in_time: null, current_session_id: null, updated_at: null, station_label: '', users: null },
            { user_id: '2', state: 'available', last_completed_at: fiveMinsAgo, check_in_time: null, current_session_id: null, updated_at: null, station_label: '', users: null },
            { user_id: '3', state: 'available', last_completed_at: tenMinsAgo, check_in_time: null, current_session_id: null, updated_at: null, station_label: '', users: null },
            { user_id: '4', state: 'offline', last_completed_at: null, check_in_time: null, current_session_id: null, updated_at: null, station_label: '', users: null },
        ];

        const sorted = sortBarbers(barbers);

        // Expect:
        // 1. Barber 3 (Available, waited 10 mins - Longest)
        // 2. Barber 2 (Available, waited 5 mins)
        // 3. Barber 1 (Busy)
        // 4. Barber 4 (Offline) - Sort function might not handle offline strictly at bottom unless logic says so, but busy/offline are non-available.
        // Looking at current logic: "if a available, b not, a wins". 
        // "If both not available", simple time sort.

        expect(sorted[0].user_id).toBe('3');
        expect(sorted[1].user_id).toBe('2');
        expect(sorted[2].state).not.toBe('available');
    });
});
