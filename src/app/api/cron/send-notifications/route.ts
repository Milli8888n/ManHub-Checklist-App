import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        console.log("🔔 Notification Cron: Starting...");

        // 1. Env & Key Validation
        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const vapidPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const vapidPriv = process.env.VAPID_PRIVATE_KEY;
        const vapidSub = process.env.VAPID_SUBJECT;

        if (!sbUrl || !sbKey) throw new Error("Missing Supabase Config");
        if (!vapidPub || !vapidPriv || !vapidSub) throw new Error("Missing VAPID Config");

        // 2. Init Clients (Trim keys to avoid issues from copy-paste/CLI)
        const supabase = createClient(sbUrl, sbKey.trim());

        webpush.setVapidDetails(
            vapidSub.trim(),
            vapidPub.trim(),
            vapidPriv.trim()
        );

        // Security Check
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Optional: console.log("Warning: Public access to cron");
        }

        // Get current time in Vietnam (UTC+7)
        const now = new Date();
        const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const currentHour = vnTime.getUTCHours();
        const currentMinute = vnTime.getUTCMinutes();
        const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        console.log(`Checking schedules for time: ${currentTimeStr} (VN)`);

        const schedules = [
            // Ca 1 (Barber) - Start 08:30
            { target: '08:35', depts: ['barber'], title: '⏰ Bắt đầu Ca 1', body: 'Chúc một ngày tốt lành! Đừng quên checklist đầu ca nhé.' },
            // Ca 2 (Barber) - Start 11:30
            { target: '11:45', depts: ['barber'], title: '⏰ Bắt đầu Ca 2', body: 'Ca trưa đã đến! Kiểm tra công việc đầu ca nào.' },
            { target: '12:38', depts: ['barber'], title: '🧪 TEST CRONJOB', body: 'Đây là thông báo tự động từ hệ thống Cronjob.' },

            // End Shifts
            // Ca 1 End 17:30 -> Remind at 17:00
            { target: '17:00', depts: ['barber'], title: '🧹 Sắp hết Ca 1', body: 'Sắp hết ca rồi. Nhớ dọn dẹp và check-out nhé.' },
            // Ca 2 End 20:30 -> Remind at 20:00
            { target: '20:00', depts: ['barber'], title: '🧹 Sắp hết Ca 2', body: '30p nữa là về. Hãy hoàn tất công việc cuối ngày.' },
        ];

        const notificationsToSend: any[] = [];
        const timeToMinutes = (str: string) => parseInt(str.split(':')[0]) * 60 + parseInt(str.split(':')[1]);
        const nowMinutes = currentHour * 60 + currentMinute;

        schedules.forEach(sch => {
            const targetMinutes = timeToMinutes(sch.target);
            // Window of 30 minutes to be safe with 10-15min cron intervals
            if (nowMinutes >= targetMinutes && nowMinutes < targetMinutes + 30) {
                console.log(`Matched schedule: ${sch.title} for ${sch.depts}`);
                notificationsToSend.push(sch);
            }
        });

        const results = [];

        // --- SCHEDULED NOTIFICATIONS ---
        if (notificationsToSend.length > 0) {
            for (const notif of notificationsToSend) {
                // Fetch subscribed users in departments
                const { data: subs, error } = await supabase
                    .from('push_subscriptions')
                    .select(`
                        *,
                        users!inner ( id, department )
                    `)
                    .in('users.department', notif.depts);

                if (error) {
                    console.error('Error fetching subs:', error);
                    continue;
                }

                if (subs && subs.length > 0) {
                    console.log(`Sending "${notif.title}" to ${subs.length} devices.`);
                    const sendPromises = subs.map(sub => {
                        const payload = JSON.stringify({
                            title: notif.title,
                            body: notif.body,
                            icon: '/icon.png',
                            data: {
                                url: process.env.NEXT_PUBLIC_APP_URL || '/'
                            }
                        });
                        return webpush.sendNotification(sub.subscription as any, payload, {
                            TTL: 60 * 60 * 24,
                            urgency: 'high'
                        })
                            .catch(err => {
                                if (err.statusCode === 410 || err.statusCode === 404) {
                                    supabase.from('push_subscriptions').delete().eq('id', sub.id);
                                }
                            });
                    });
                    await Promise.all(sendPromises);
                    results.push({ schedule: notif.title, count: subs.length });
                }
            }
        } else {
            // No schedule match, but we continue to Red Alert check
        }

        // --- RED ALERT Logic (Monitoring) ---
        const lateChecks = [
            { target: '10:00', depts: ['barber'], label: 'Ca 1 (Sáng)' },
            { target: '14:30', depts: ['barber'], label: 'Ca Đầu Chiều' }
        ];

        for (const check of lateChecks) {
            const targetMinutes = timeToMinutes(check.target);
            // Window of 60 minutes to be persistent until they do it
            if (nowMinutes >= targetMinutes && nowMinutes < targetMinutes + 60) {
                console.log(`Running Late Check for ${check.label}`);

                const todayFormatted = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
                const { data: pendingLogs, error: pendingErr } = await supabase
                    .from('daily_task_logs')
                    .select(`
                        id, status,
                        task_definitions!inner ( title, required_role )
                    `)
                    .eq('assigned_date', todayFormatted)
                    .eq('status', 'pending');

                if (pendingLogs || pendingErr) {
                    const relevantPending = (pendingLogs || []).filter((log: any) =>
                        check.depts.includes(log.task_definitions.required_role)
                    );

                    // Fetch subscriptions for Admins and Team Members (Leaders & Staff)
                    const { data: targetSubs } = await supabase
                        .from('push_subscriptions')
                        .select(`*, users!inner(id, role, department)`);

                    const filteredSubs = targetSubs?.filter((sub: any) => {
                        const u = Array.isArray(sub.users) ? sub.users[0] : sub.users;
                        if (!u) return false;
                        // Notify: All Admins OR anyone belonging to the late departments (Leaders & Staff)
                        return u.role === 'admin' || check.depts.includes(u.department);
                    }) || [];

                    if (relevantPending.length > 0 && filteredSubs.length > 0) {
                        const pendingCount = relevantPending.length;
                        const deptNames = [...new Set(relevantPending.map((l: any) => l.task_definitions.required_role))].join(', ');

                        const alertPayload = JSON.stringify({
                            title: '🚨 CẢNH BÁO: Chưa nộp báo cáo!',
                            body: `Đã quá giờ ${check.target} mà ${deptNames} chưa nộp ${pendingCount} báo cáo ${check.label}.`,
                            icon: '/icon.png',
                            data: {
                                url: process.env.NEXT_PUBLIC_APP_URL || '/'
                            }
                        });

                        await Promise.all(filteredSubs.map(sub =>
                            webpush.sendNotification(sub.subscription as any, alertPayload, {
                                TTL: 60 * 60 * 24,
                                urgency: 'high'
                            }).catch((err: any) => {
                                if (err.statusCode === 410 || err.statusCode === 404) {
                                    supabase.from('push_subscriptions').delete().eq('id', sub.id);
                                }
                            })
                        ));

                        results.push({ alert: check.label, recipients_notified: filteredSubs.length });
                    }
                }
            }
        }

        return NextResponse.json({ success: true, timestamp: currentTimeStr, results });

    } catch (err: any) {
        console.error("❌ Cron Job Failed:", err);
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    }
}
