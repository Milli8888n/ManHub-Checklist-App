'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { compressAndUploadImage } from '@/lib/storage';
import {
    ClipboardList,
    User,
    Clock,
    Settings,
    LogOut,
    Sparkles,
    BarChart2,
    Bell,
    BellOff,
    LayoutDashboard,
    Scissors,
    Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import GlobalNav from './GlobalNav';
import AppHeader from './AppHeader';
import Image from 'next/image';
import TaskCard from './TaskCard';
import AdminStats from './AdminStats';
import TaskManagement from './TaskManagement';
import ScheduleManagement from './ScheduleManagement';
import StaffManagement from './StaffManagement';
import ViolationManagement from './ViolationManagement';

interface TaskLog {
    id: string;
    task_def_id: string;
    status: 'pending' | 'submitted' | 'completed' | 'rejected';
    assigned_date: string;
    image_url: string | null;
    performed_by: string | null;
    task_definitions: {
        title: string;
        description: string;
        area: string;
        is_photo_required: boolean;
        shift: string;
        required_role: string;
        frequency: string;
        estimated_duration: string;
    };
    users?: {
        full_name: string;
    };
}

export default function Dashboard() {
    const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('daily');
    const [adminSubTab, setAdminSubTab] = useState<'task' | 'staff' | 'violation'>('task');
    const [userRole, setUserRole] = useState<string>('staff');
    const [userName, setUserName] = useState<string>('');
    const [userId, setUserId] = useState<string | null>(null);
    const [userDepartment, setUserDepartment] = useState<string | null>(null);
    const [userTodayShift, setUserTodayShift] = useState<string>('OFF');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const router = useRouter();


    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(async (registration) => {
                const sub = await registration.pushManager.getSubscription();
                setIsSubscribed(!!sub);
            });
        }
    }, []);

    const fetchTaskLogs = async (role: string, dept: string | null, todayShift: string = 'Full') => {
        const today = selectedDate;

        let { data, error } = await supabase
            .from('daily_task_logs')
            .select('*, task_definitions(*), users(full_name)')
            .eq('assigned_date', today);

        if (error) {
            console.error('Error fetching logs:', error);
            return;
        }

        if (!data || data.length === 0) {
            const { data: defs } = await supabase.from('task_definitions').select('*');

            if (defs && defs.length > 0) {
                const newLogs = defs.map(def => ({
                    task_def_id: def.id,
                    assigned_date: today,
                    status: 'pending'
                }));

                const { data: inserted } = await supabase
                    .from('daily_task_logs')
                    .insert(newLogs)
                    .select('*, task_definitions(*)');

                if (inserted) data = inserted;
            }
        }

        let processedData = (data || []).filter(t => t.task_definitions);

        const todayDate = new Date();
        const isSunday = todayDate.getDay() === 0;

        if (role !== 'admin') {
            if (dept) {
                processedData = processedData.filter(t => t.task_definitions.required_role === dept);
            }
            
            if (role === 'staff') {
                processedData = processedData.filter(t => {
                    const taskShift = t.task_definitions.shift;
                    if (isSunday && taskShift === 'weekend') return true;
                    if (taskShift === 'all') return true;
                    if (todayShift === 'Full') return true;
                    if (todayShift === 'Ca 1' && taskShift === 'morning') return true;
                    if (todayShift === 'Ca 2' && taskShift === 'evening') return true;
                    return false;
                });
            }
        }

        setTaskLogs(processedData);
        setLoading(false);
    };

    const initializeUserAndData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        let role = 'staff';
        let dept = null;
        let name = '';
        let todayShift = 'OFF';

        if (user) {
            const { data: profile } = await supabase
                .from('users')
                .select('role, department, full_name')
                .eq('id', user.id)
                .single();
            if (profile) {
                role = profile.role;
                dept = profile.department;
                name = profile.full_name;
                setUserRole(role);
                setUserDepartment(dept);
                setUserName(name);
                setUserId(user.id);
            }
            
            const todayStr = new Date().toISOString().split('T')[0];
            const { data: schedule } = await supabase
                .from('work_schedules')
                .select('shift')
                .eq('user_id', user.id)
                .eq('date', todayStr)
                .single();
                
            if (schedule) {
                todayShift = schedule.shift;
                setUserTodayShift(todayShift);
            }
        }

        await fetchTaskLogs(role, dept, todayShift);
    };

    useEffect(() => {
        initializeUserAndData();
    }, [selectedDate]);

    const sendNotification = async (payload: { role?: string, userIds?: string[], title: string, body: string }) => {
        try {
            const resp = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) {
                console.error('Notification API Error');
            }
        } catch (err) {
            console.error('Failed to send notification request', err);
        }
    };

    const handleSubmitTask = async (logId: string, photoUrl: string) => {
        setUpdatingId(logId);
        const { error } = await supabase
            .from('daily_task_logs')
            .update({
                status: 'submitted',
                image_url: photoUrl,
                performed_by: userId
            })
            .eq('id', logId);

        if (!error) {
            setTaskLogs(prev => prev.map(t =>
                t.id === logId ? {
                    ...t,
                    status: 'submitted' as const,
                    image_url: photoUrl,
                    performed_by: userId,
                    users: { full_name: userName }
                } : t
            ));

            const task = taskLogs.find(t => t.id === logId);
            const taskName = task?.task_definitions.title || 'Một công việc';
            const dept = task?.task_definitions.required_role || '';

            const { data: leaders } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'leader')
                .eq('department', dept);

            const leaderIds = leaders?.map(u => u.id).filter(id => id !== userId) || [];

            await sendNotification({
                role: 'admin',
                userIds: leaderIds,
                title: '📋 Báo cáo mới!',
                body: `${userName} (${dept}) vừa gửi báo cáo: ${taskName}. Duyệt ngay!`
            });
        }
        setUpdatingId(null);
    };

    const handleApproveTask = async (logId: string) => {
        setUpdatingId(logId);
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('daily_task_logs')
            .update({
                status: 'completed',
                approved_by: user?.id,
                approved_at: new Date().toISOString()
            })
            .eq('id', logId);

        if (!error) {
            setTaskLogs(prev => prev.map(t =>
                t.id === logId ? { ...t, status: 'completed' as const } : t
            ));

            const task = taskLogs.find(t => t.id === logId);
            if (task) {
                const dept = task.task_definitions.required_role;
                const { data: users } = await supabase.from('users').select('id').eq('department', dept);

                if (users && users.length > 0) {
                    await sendNotification({
                        userIds: users.map(u => u.id),
                        title: '✅ Báo cáo đã được duyệt!',
                        body: `Admin đã duyệt "${task.task_definitions.title}". Good job!`
                    });
                }
            }
        }
        setUpdatingId(null);
    };

    const handleRejectTask = async (logId: string, reason?: string) => {
        setUpdatingId(logId);
        const { error } = await supabase
            .from('daily_task_logs')
            .update({
                status: 'rejected',
                rejection_reason: reason || null
            })
            .eq('id', logId);

        if (!error) {
            setTaskLogs(prev => prev.map(t =>
                t.id === logId ? { ...t, status: 'rejected' as const, rejection_reason: reason || null } : t
            ));

            const task = taskLogs.find(t => t.id === logId);
            if (task) {
                const dept = task.task_definitions.required_role;
                const { data: users } = await supabase.from('users').select('id').eq('department', dept);

                if (users && users.length > 0) {
                    await sendNotification({
                        userIds: users.map(u => u.id),
                        title: '⚠️ Báo cáo bị từ chối!',
                        body: `Admin từ chối "${task.task_definitions.title}". Lý do: ${reason}. Làm lại ngay!`
                    });
                }
            }
        }
        setUpdatingId(null);
    };

    const handleFileUpload = async (file: File) => {
        const fileName = `${Date.now()}-${file.name}`;
        const path = `daily-proofs/${fileName}`;
        return await compressAndUploadImage(file, path);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#1A2B56] text-[#f4ece0] font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <Image src="/manhub_logo.png" alt="ManHub" width={150} height={80} className="animate-pulse" priority />
                        <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-[#c9a227] animate-bounce" />
                    </div>
                    <p className="text-xl font-medium tracking-tight text-[#8a9bb0]">Đang khởi tạo...</p>
                </div>
            </div>
        );
    }

    const validTaskLogs = taskLogs.filter(t => t.task_definitions);

    const stats = {
        totalTasks: validTaskLogs.length,
        completedTasks: validTaskLogs.filter(t => t.status === 'completed').length,
        photoTasks: validTaskLogs.filter(t => t.task_definitions?.is_photo_required).length,
        photoCompleted: validTaskLogs.filter(t => t.status === 'completed' && t.task_definitions?.is_photo_required).length,
    };

    const areas = Array.from(new Set(validTaskLogs.map(t => t.task_definitions.area)));

    return (
        <div className="min-h-screen bg-[#1a2d47] text-[#f4ece0] font-sans selection:bg-[#c9a227]/30 pb-32" >
            <AppHeader />


            <main className="max-w-7xl mx-auto px-4 md:px-8">
                {activeTab === 'daily' ? (
                    <>
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                             <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <ClipboardList className="h-7 w-7 text-[#c9a227]" />
                                    <h2 className="text-2xl font-black tracking-tight text-[#f4ece0]">
                                        {selectedDate === new Date().toISOString().split('T')[0] ? 'Checklist hôm nay' : `Lịch sử: ${selectedDate}`}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="dashboard-date" className="sr-only">Lọc theo ngày</label>
                                    <input
                                        id="dashboard-date"
                                        type="date"
                                        aria-label="Lọc theo ngày"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="bg-[#0f1c2e]/60 border border-[#2a4a6f] rounded-xl px-3 py-1.5 text-sm text-[#f4ece0] outline-none"
                                    />
                                </div>
                            </div>
                            {userRole === 'staff' && (
                                <div className={`px-4 py-2 rounded-2xl border font-black text-xs uppercase tracking-widest ${userTodayShift === 'OFF' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                    Ca làm việc: {userTodayShift}
                                </div>
                            )}
                        </div>

                        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AdminStats {...stats} />
                        </div>

                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             {areas.map(area => (
                                <div key={area} className="space-y-5">
                                    <div className="flex items-center gap-3 ml-2 group">
                                        <div className="h-2 w-2 rounded-full bg-[#c9a227] shadow-[0_0_10px_rgba(201,162,39,0.5)]" />
                                        <h3 className="text-[#8a9bb0] text-xs font-black uppercase tracking-[0.25em] group-hover:text-[#f4ece0] transition-colors">{area}</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {validTaskLogs.filter(t => t.task_definitions.area === area).map(task => (
                                            <TaskCard
                                                key={task.id}
                                                id={task.id}
                                                title={task.task_definitions.title}
                                                description={task.task_definitions.description}
                                                area={task.task_definitions.area}
                                                status={task.status}
                                                isPhotoRequired={task.task_definitions.is_photo_required}
                                                imageUrl={task.image_url}
                                                frequency={task.task_definitions.frequency}
                                                duration={task.task_definitions.estimated_duration}
                                                userRole={userRole}
                                                currentUserId={userId}
                                                performedBy={task.performed_by}
                                                onSubmit={handleSubmitTask}
                                                onApprove={handleApproveTask}
                                                onReject={handleRejectTask}
                                                onUpload={handleFileUpload}
                                                isUpdating={updatingId === task.id}
                                                submittedBy={task.users?.full_name}
                                                department={task.task_definitions.required_role}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : activeTab === 'admin' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
                        <div className="flex bg-[#0f1c2e]/80 p-1.5 rounded-2xl border border-[#c9a227]/20 backdrop-blur-md w-full max-w-lg mx-auto shadow-lg">
                            <button onClick={() => setAdminSubTab('task')} className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-xl transition-all ${adminSubTab === 'task' ? 'bg-[#c9a227] text-[#0f1c2e]' : 'text-[#8a9bb0]'}`}>Quy trình</button>
                            <button onClick={() => setAdminSubTab('staff')} className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-xl transition-all ${adminSubTab === 'staff' ? 'bg-[#c9a227] text-[#0f1c2e]' : 'text-[#8a9bb0]'}`}>Nhân sự</button>
                            <button onClick={() => setAdminSubTab('violation')} className={`flex-1 py-2.5 px-3 text-sm font-bold rounded-xl transition-all ${adminSubTab === 'violation' ? 'bg-red-500 text-white' : 'text-red-500/50'}`}>Kỷ luật</button>
                        </div>
                        {adminSubTab === 'task' ? (
                            <TaskManagement userRole={userRole} userDepartment={userDepartment} />
                        ) : adminSubTab === 'staff' ? (
                            <StaffManagement />
                        ) : (
                            <ViolationManagement currentUserId={userId} onNotify={sendNotification} />
                        )}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ScheduleManagement userRole={userRole} currentUserId={userId!} />
                    </div>
                )}
            </main>

            <GlobalNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} userRole={userRole} />
        </div>
    );
}
