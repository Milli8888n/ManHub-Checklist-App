import { Database } from './database.types';

type BarberStatus = Database['public']['Tables']['barber_status']['Row'] & {
    users: {
        full_name: string | null;
        username: string | null;
    } | null;
};

// Configurable weights
const WEIGHTS = {
    WALK_IN: 1.0,
    BOOKING: 1.2,
};

/**
 * Calculates priority score.
 * specific logic: Higher score = Higher priority (Top of queue).
 * Score ~ "Effective Waiting Time"
 * 
 * Formula: (Now - LastTime) / Weight
 */
export function calculatePriorityScore(
    lastCompletedAt: string | null,
    previousCustomerType: 'walk_in' | 'booking' = 'walk_in',
    now: number = Date.now(),
    manualWeight?: number, // Support override for testing
    checkInTime?: string | null
): number {
    const rawTime = lastCompletedAt || checkInTime || '1970-01-01T00:00:00Z';
    const finishedTime = new Date(rawTime).getTime();
    const waitTime = now - finishedTime;

    let weight = manualWeight ?? (previousCustomerType === 'booking' ? WEIGHTS.BOOKING : WEIGHTS.WALK_IN);
    const finalWeight = weight <= 0 ? 1 : weight;

    // If never completed, and no check-in, they wait "forever"
    if (!lastCompletedAt && !checkInTime) return now + 1000000;

    return waitTime / finalWeight;
}

export function sortBarbers(barbers: BarberStatus[]): BarberStatus[] {
    const now = Date.now();
    return [...barbers].sort((a, b) => {
        // 1. Status Check: Available comes first
        if (a.state === 'available' && b.state !== 'available') return -1;
        if (a.state !== 'available' && b.state === 'available') return 1;

        // 2. Scores
        // Note: Realistically we'd need to fetch the last customer type for each.
        // For now we assume default walk-in if not available in row.
        const scoreA = calculatePriorityScore(a.last_completed_at, 'walk_in', now, undefined, a.check_in_time);
        const scoreB = calculatePriorityScore(b.last_completed_at, 'walk_in', now, undefined, b.check_in_time);

        if (scoreA !== scoreB) {
            return scoreB - scoreA; // Descending
        }

        // 3. Tie-breaker: original ID order
        return a.user_id.localeCompare(b.user_id);
    });
}
