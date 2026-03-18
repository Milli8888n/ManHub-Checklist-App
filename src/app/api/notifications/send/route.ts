import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    // Verify environment variables
    if (!process.env.VAPID_SUBJECT || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.error('Missing VAPID configuration');
        return NextResponse.json({ success: false, error: 'Missing VAPID configuration' }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase configuration');
        return NextResponse.json({ success: false, error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT!.trim(),
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim(),
            process.env.VAPID_PRIVATE_KEY!.trim()
        );

        const { userIds, role, title, body } = await req.json();

        let targetUserIds = userIds || [];

        // If role is specified (e.g., 'admin'), fetch all admin IDs
        if (role) {
            const { data: users, error } = await supabase
                .from('users')
                .select('id')
                .eq('role', role);

            if (users) {
                targetUserIds = [...targetUserIds, ...users.map(u => u.id)];
            }
        }

        if (targetUserIds.length === 0) {
            return NextResponse.json({ message: 'No recipients found' });
        }

        // Fetch subscriptions for these users
        const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('*')
            .in('user_id', targetUserIds);

        if (!subs || subs.length === 0) {
            return NextResponse.json({ message: 'No subscriptions found for targeting users' });
        }

        console.log(`Sending "${title}" to ${subs.length} devices.`);

        const sendPromises = subs.map(sub => {
            const payload = JSON.stringify({
                title,
                body,
                icon: '/icon.png',
                data: {
                    url: process.env.NEXT_PUBLIC_APP_URL || '/'
                }
            });

            return webpush.sendNotification(sub.subscription as any, payload, {
                TTL: 60 * 60 * 24, // 24 hours
                urgency: 'high'
            })
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        supabase.from('push_subscriptions').delete().eq('id', sub.id);
                    }
                });
        });

        await Promise.all(sendPromises);

        return NextResponse.json({ success: true, count: subs.length });

    } catch (error: any) {
        console.error('Error sending notification:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
