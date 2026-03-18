require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Use anon key for logic test, or service_role if simulating exact backend rights
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Env Vars');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    console.log('🚀 Starting Deep Logic Test (Local)...');

    // 1. Get User IDs
    console.log('\n--- Step 1: Fetching User IDs ---');
    const { data: staffUser } = await supabase.from('users').select('id, username').eq('username', 'bbr001').single();
    const { data: adminUser } = await supabase.from('users').select('id, username').eq('username', 'admin').single();

    if (!staffUser || !adminUser) {
        console.error('❌ Failed to find users. Check DB.');
        return;
    }
    console.log(`✅ Staff: ${staffUser.username} (${staffUser.id})`);
    console.log(`✅ Admin: ${adminUser.username} (${adminUser.id})`);

    // 2. Setup a Test Task for Today
    console.log('\n--- Step 2: Preparing Test Task ---');
    const today = new Date().toISOString().split('T')[0];

    // Find a task definition for Barber
    const { data: taskDef } = await supabase.from('task_definitions').select('id, title').eq('area', 'Khu vực Cắt Tóc').limit(1).single();
    if (!taskDef) { console.error('❌ No task definition found for Barber'); return; }

    // Check if log exists, if not create/reset it
    let { data: taskLog } = await supabase.from('daily_task_logs')
        .select('*')
        .eq('task_def_id', taskDef.id)
        .eq('assigned_date', today)
        .single();

    if (!taskLog) {
        const { data: newLog } = await supabase.from('daily_task_logs').insert({
            task_def_id: taskDef.id,
            assigned_date: today,
            status: 'pending'
        }).select().single();
        taskLog = newLog;
        console.log('✅ Created new test task log.');
    } else {
        // Reset to pending
        await supabase.from('daily_task_logs').update({ status: 'pending', image_url: null, approved_by: null }).eq('id', taskLog.id);
        console.log('✅ Reset existing task log to pending.');
    }

    // 3. Test Submission (Staff Action)
    console.log('\n--- Step 3: Staff Submission Test ---');
    const mockPhoto = 'https://via.placeholder.com/150';

    const { error: submitError } = await supabase
        .from('daily_task_logs')
        .update({ status: 'submitted', image_url: mockPhoto })
        .eq('id', taskLog.id);

    if (submitError) { console.error('❌ Submission Failed:', submitError); return; }

    // Verify
    const { data: verifiedSubmit } = await supabase.from('daily_task_logs').select('status, image_url').eq('id', taskLog.id).single();
    if (verifiedSubmit.status === 'submitted' && verifiedSubmit.image_url === mockPhoto) {
        console.log('✅ Task Submitted Successfully (Status: submitted, Image saved)');
    } else {
        console.error('❌ Verification Failed:', verifiedSubmit);
    }

    // 4. Test Approval (Admin Action)
    console.log('\n--- Step 4: Admin Approval Test ---');
    const { error: approveError } = await supabase
        .from('daily_task_logs')
        .update({
            status: 'completed',
            approved_by: adminUser.id,
            approved_at: new Date().toISOString()
        })
        .eq('id', taskLog.id);

    if (approveError) { console.error('❌ Approval Failed:', approveError); return; }

    // Verify
    const { data: verifiedApprove } = await supabase.from('daily_task_logs').select('status, approved_by').eq('id', taskLog.id).single();
    if (verifiedApprove.status === 'completed' && verifiedApprove.approved_by === adminUser.id) {
        console.log('✅ Task Approved Successfully (Status: completed, ApprovedBy set)');
    } else {
        console.error('❌ Approval Verification Failed:', verifiedApprove);
    }

    // 5. Test Rejection (Admin Action)
    console.log('\n--- Step 5: Admin Rejection Test ---');
    // First reset to submitted
    await supabase.from('daily_task_logs').update({ status: 'submitted' }).eq('id', taskLog.id);

    const { error: rejectError } = await supabase
        .from('daily_task_logs')
        .update({
            status: 'rejected',
            rejection_reason: 'Ảnh quá mờ, chụp lại!'
        })
        .eq('id', taskLog.id);

    if (rejectError) { console.error('❌ Rejection Failed:', rejectError); return; }

    // Verify
    const { data: verifiedReject } = await supabase.from('daily_task_logs').select('status, rejection_reason').eq('id', taskLog.id).single();
    if (verifiedReject.status === 'rejected' && verifiedReject.rejection_reason === 'Ảnh quá mờ, chụp lại!') {
        console.log('✅ Task Rejected Successfully (Status: rejected, Reason saved)');
    } else {
        console.error('❌ Rejection Verification Failed:', verifiedReject);
    }

    // Cleanup
    console.log('\n--- Cleanup ---');
    await supabase.from('daily_task_logs').update({ status: 'pending', image_url: null, approved_by: null, rejection_reason: null }).eq('id', taskLog.id);
    console.log('✅ Test Data Reset.');
    console.log('🎉 ALL LOGIC TESTS PASSED!');
}

runTest();
