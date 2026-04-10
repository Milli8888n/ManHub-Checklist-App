import { describe, it, expect } from 'vitest';
import { isShiftActive } from './queue-algorithm';

describe('isShiftActive', () => {
    // Helper to create date from hours:minutes relative to today
    const createTime = (hours: number, minutes: number) => {
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        return d;
    };

    it('should identify Ca 1 (08:30 - 17:30)', () => {
        expect(isShiftActive('Ca 1', createTime(9, 0))).toBe(true);
        expect(isShiftActive('Ca 1', createTime(17, 0))).toBe(true);
        expect(isShiftActive('Ca 1', createTime(8, 29))).toBe(false);
        expect(isShiftActive('Ca 1', createTime(17, 31))).toBe(false);
    });

    it('should identify Ca 2 (11:30 - 20:30)', () => {
        expect(isShiftActive('Ca 2', createTime(12, 0))).toBe(true);
        expect(isShiftActive('Ca 2', createTime(20, 0))).toBe(true);
        expect(isShiftActive('Ca 2', createTime(11, 29))).toBe(false);
        expect(isShiftActive('Ca 2', createTime(20, 31))).toBe(false);
    });

    it('should identify Full (08:30 - 20:30)', () => {
        expect(isShiftActive('Full', createTime(9, 0))).toBe(true);
        expect(isShiftActive('Full', createTime(20, 0))).toBe(true);
        expect(isShiftActive('Full', createTime(8, 29))).toBe(false);
        expect(isShiftActive('Full', createTime(20, 31))).toBe(false);
    });

    it('should handle overlap (14:00)', () => {
        const midTime = createTime(14, 0);
        expect(isShiftActive('Ca 1', midTime)).toBe(true);
        expect(isShiftActive('Ca 2', midTime)).toBe(true);
        expect(isShiftActive('Full', midTime)).toBe(true);
    });
});
