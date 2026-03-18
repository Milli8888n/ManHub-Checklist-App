import { expect, test, vi } from 'vitest';
import { compressAndUploadImage } from './storage';
import { supabase } from './supabase';

vi.mock('browser-image-compression', () => ({
    default: vi.fn().mockResolvedValue(new Blob(['compressed'], { type: 'image/jpeg' })),
}));

vi.mock('./supabase', () => ({
    supabase: {
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.com/test.jpg' } })),
            })),
        },
    },
}));

test('compressAndUploadImage compresses and uploads successfully', async () => {
    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    const url = await compressAndUploadImage(file, 'path/to/test.jpg');

    expect(url).toBe('https://test.com/test.jpg');
    expect(supabase.storage.from).toHaveBeenCalledWith('task-proofs');
});
