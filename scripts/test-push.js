require('dotenv').config({ path: '.env.local' });
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

// Validate ENV
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@manhub.com';

if (!supabaseUrl || !supabaseKey || !vapidPublicKey || !vapidPrivateKey) {
    console.error('❌ Missing Environment Variables. Please check .env.local file.');
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
);

async function sendTestNotification() {
    console.log('🔍 Fetching push subscriptions from database...');

    // Fetch all subscriptions (or limit to recently active ones)
    const { data: subs, error } = await supabase
        .from('push_subscriptions')
        .select('*');

    if (error) {
        console.error('❌ Database Error:', error.message);
        return;
    }

    if (!subs || subs.length === 0) {
        console.log('⚠️ No subscriptions found (OR Permission Denied due to RLS).');
        console.log('👉 Tip: Ensure you have SUPABASE_SERVICE_ROLE_KEY in .env.local for full access, or temporarily disable RLS.');
        console.log('👉 Also ensure you have clicked the Bell icon in the App.');
        return;
    }

    console.log(`📱 Found ${subs.length} registered devices.`);

    let successCount = 0;
    let failCount = 0;

    for (const subRecord of subs) {
        // The DB stores the whole subscription object in a 'subscription' JSONB column
        const subData = subRecord.subscription;

        if (!subData || !subData.endpoint) {
            console.warn(`⚠️ Invalid subscription data for User ID: ${subRecord.user_id}`);
            continue;
        }

        const pushSubscription = {
            endpoint: subData.endpoint,
            keys: {
                auth: subData.keys.auth,
                p256dh: subData.keys.p256dh
            }
        };

        const payload = JSON.stringify({
            title: '🔔 ManHub Test Notification',
            body: `Hệ thống hoạt động tốt! Kiểm tra lúc: ${new Date().toLocaleTimeString()}`,
            icon: '/icon.png',
            badge: '/icon.png'
        });

        try {
            await webpush.sendNotification(pushSubscription, payload);
            console.log(`✅ Sent successfully to User ID: ${subRecord.user_id}`);
            successCount++;
        } catch (err) {
            console.error(`❌ Failed to send to User ID: ${subRecord.user_id}`);
            console.error(`   Error details: ${err.message}`);

            if (err.statusCode === 410) {
                console.log('   (Subscription is expired or invalid. You should delete this record from DB)');
            }
            failCount++;
        }
    }

    console.log('\n--- Summary ---');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

sendTestNotification();
