import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    console.log("⏰ Daily Task Generator: Starting...");

    // 1. Security Check (Cron Secret)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Init Supabase Admin Client (Required for Server-side operations)
    // IMPORTANT: User must add SUPABASE_SERVICE_ROLE_KEY to env vars
    // If not present, warn clearly.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
        console.error("❌ Critical: SUPABASE_SERVICE_ROLE_KEY is missing. Task generation failed.");
        return NextResponse.json({
            error: 'Config Error: Missing Service Role Key',
            hint: 'Add SUPABASE_SERVICE_ROLE_KEY to Vercel Environment Variables.'
        }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Logic: Check & Create
    try {
        // VN Time Calculation: Ensure we generate for the correct "Today" in Vietnam
        const now = new Date();
        const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const todayStr = vnTime.toISOString().split('T')[0];

        console.log(`Checking tasks for date (VN): ${todayStr}`);

        // Check if tasks already exist for this date
        const { count, error: countErr } = await supabase
            .from('daily_task_logs')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_date', todayStr);

        if (countErr) throw countErr;

        if (count && count > 0) {
            console.log("✅ Tasks already exist for today. Skipping.");
            return NextResponse.json({ message: 'Tasks already exist', date: todayStr });
        }

        // Fetch Definitions
        const { data: defs, error: defErr } = await supabase.from('task_definitions').select('*');
        if (defErr) throw defErr;

        if (!defs || defs.length === 0) {
            console.log("⚠️ No task definitions found.");
            return NextResponse.json({ message: 'No definitions to generate from' });
        }

        // Prepare Insert Payload
        const newLogs = defs.map(def => ({
            task_def_id: def.id,
            assigned_date: todayStr,
            status: 'pending'
        }));

        // Execute Insert
        const { error: insertErr } = await supabase.from('daily_task_logs').insert(newLogs);
        if (insertErr) throw insertErr;

        console.log(`🎉 Successfully generated ${newLogs.length} tasks for ${todayStr}`);

        return NextResponse.json({ success: true, generated_count: newLogs.length, date: todayStr });

    } catch (err: any) {
        console.error("❌ Generation Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
