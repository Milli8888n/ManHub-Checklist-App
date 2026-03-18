import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

export async function compressAndUploadImage(file: File, path: string) {
    // 1. Compression options
    const options = {
        maxSizeMB: 0.5, // Max 500KB
        maxWidthOrHeight: 1200,
        useWebWorker: false, // Disable web worker to avoid issues in test env
    };

    try {
        // 2. Compress
        const compressedFile = await imageCompression(file, options);

        // 3. Upload to Supabase Storage (Bucket name: 'task-proofs')
        const { data, error } = await supabase.storage
            .from('task-proofs')
            .upload(path, compressedFile, {
                upsert: true,
            });

        if (error) throw error;

        // 4. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('task-proofs')
            .getPublicUrl(path);

        return publicUrl;
    } catch (error) {
        console.warn('Image compression failed, uploading original file:', error);

        try {
            // Fallback: Upload original file
            const { data, error: uploadError } = await supabase.storage
                .from('task-proofs')
                .upload(path, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('task-proofs')
                .getPublicUrl(path);

            return publicUrl;
        } catch (finalError) {
            console.error('Image upload failed (fallback):', finalError);
            throw finalError;
        }
    }
}
