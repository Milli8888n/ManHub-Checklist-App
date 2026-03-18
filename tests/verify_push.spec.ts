import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

test.describe('Push Notification System Tests', () => {

    test('TC-PUSH-01: Notification API should return 200 OK', async ({ request }) => {
        const response = await request.get('/api/cron/send-notifications');

        expect(response.status()).toBe(200);

        const body = await response.json();
        console.log('Notification API Response:', body);

        expect(body.success).toBe(true);
        expect(body.timestamp).toBeDefined();
    });

    test('TC-PUSH-02: Database should have push subscriptions', async () => {
        // Use Service Role Key to bypass RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://efzkezwcjacwovaomoca.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseKey) {
            console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY not set. Skipping DB verification.');
            test.skip();
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: subs, error } = await supabase
            .from('push_subscriptions')
            .select('id, user_id, created_at')
            .limit(5);

        if (error) {
            console.error('DB Error:', error.message);
            throw error;
        }

        console.log(`Found ${subs?.length || 0} push subscriptions in database.`);

        // We expect at least 1 subscription (from manual testing earlier)
        expect(subs).not.toBeNull();
        expect(subs!.length).toBeGreaterThan(0);

        console.log('✅ Push subscriptions verified in database.');
    });

    test('TC-PUSH-03: Subscription data structure is valid', async () => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://efzkezwcjacwovaomoca.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseKey) {
            console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY not set. Skipping.');
            test.skip();
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: subs, error } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .limit(1);

        if (error || !subs || subs.length === 0) {
            console.log('No subscriptions to validate.');
            test.skip();
            return;
        }

        const sub = subs[0].subscription;

        // Validate structure
        expect(sub).toHaveProperty('endpoint');
        expect(sub).toHaveProperty('keys');
        expect(sub.keys).toHaveProperty('auth');
        expect(sub.keys).toHaveProperty('p256dh');

        console.log('✅ Subscription data structure is valid.');
    });

});
