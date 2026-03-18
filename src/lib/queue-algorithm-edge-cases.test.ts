import { describe, it, expect } from 'vitest';
import { calculatePriorityScore, sortBarbers } from './queue-algorithm';
import { Database } from './database.types';

type BarberStatus = Database['public']['Tables']['barber_status']['Row'] & {
    users: {
        full_name: string | null;
        username: string | null;
    } | null;
};

describe('Queue Algorithm Edge Cases', () => {

    it('should handle zero or negative weights by defaulting to 1', () => {
        const now = 1000000;
        const lastCompleted = new Date(now - 10000).toISOString();

        const scoreZero = calculatePriorityScore(lastCompleted, 'walk_in', now, 0);
        const scoreOne = calculatePriorityScore(lastCompleted, 'walk_in', now, 1);

        expect(scoreZero).toBe(scoreOne);
    });

    it('should prioritize the earlier check-in if multiple barbers have no completion history', () => {
        const barbers: BarberStatus[] = [
            {
                user_id: 'new-1', state: 'available', last_completed_at: null,
                check_in_time: '2026-01-01T08:00:00Z', station_label: '', users: null,
                current_session_id: null, updated_at: null
            },
            {
                user_id: 'new-2', state: 'available', last_completed_at: null,
                check_in_time: '2026-01-01T07:30:00Z', station_label: '', users: null,
                current_session_id: null, updated_at: null
            }
        ];

        const sorted = sortBarbers(barbers);
        // new-2 checked in earlier, should be first
        expect(sorted[0].user_id).toBe('new-2');
    });

    it('should verify that a Booking barber (weight 1.2) stays behind a Walk-in barber (weight 1.0) if their wait times are close', () => {
        const now = 1000000;
        const lastCompletedWalkIn = new Date(now - 10000).toISOString(); // Waited 10s
        const lastCompletedBooking = new Date(now - 11000).toISOString(); // Waited 11s, but penalized

        const scoreWalkIn = calculatePriorityScore(lastCompletedWalkIn, 'walk_in', now); // 10000 / 1.0 = 10000
        const scoreBooking = calculatePriorityScore(lastCompletedBooking, 'booking', now); // 11000 / 1.2 = 9166

        expect(scoreWalkIn).toBeGreaterThan(scoreBooking);
    });

    it('should handle extreme timestamps safely', () => {
        const now = Date.now();
        const wayBack = new Date(0).toISOString(); // 1970
        const score = calculatePriorityScore(wayBack, 'walk_in', now);
        expect(isFinite(score)).toBe(true);
        expect(score).toBeGreaterThan(0);
    });
});
