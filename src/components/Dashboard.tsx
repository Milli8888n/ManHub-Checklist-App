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
    Scissors
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TaskCard from './TaskCard';
import AdminStats from './AdminStats';
import TaskManagement from './TaskManagement';

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
    const [activeTab, setActiveTab] = useState<'daily' | 'admin'>('daily');
    const [userRole, setUserRole] = useState<string>('staff');
    const [userName, setUserName] = useState<string>('');
    const [userId, setUserId] = useState<string | null>(null);
    const [userDepartment, setUserDepartment] = useState<string | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const router = useRouter();

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('Trình duyệt của bạn không hỗ trợ thông báo!');
            return;
        }

        try {
            // Check current permission
            if (Notification.permission === 'denied') {
                alert('Bạn đã chặn thông báo trên trình duyệt. Vui lòng vào Cài đặt trình duyệt để cho phép và thử lại!');
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim())
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('push_subscriptions').upsert({
                    user_id: user.id,
                    subscription: sub,
                    user_agent: navigator.userAgent
                }, { onConflict: 'user_id, user_agent' });
            }

            setIsSubscribed(true);
            alert('Đã bật thông báo thành công!');
        } catch (error) {
            console.error('Subscription failed:', error);
            alert('Không thể bật thông báo. Nếu bạn dùng iPhone, hãy chắc chắn đã "Thêm vào màn hình chính" (Add to Home Screen) trước khi cài đặt!');
        }
    };

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(async (registration) => {
                const sub = await registration.pushManager.getSubscription();
                setIsSubscribed(!!sub);
            });
        }
    }, []);

    const fetchTaskLogs = async (role: string, dept: string | null) => {
        const today = new Date().toISOString().split('T')[0];

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

        // Apply department filtering in memory for reliability
        let processedData = (data || []).filter(t => t.task_definitions);

        if (role !== 'admin' && dept) {
            processedData = processedData.filter(t => t.task_definitions.required_role === dept);
        }

        setTaskLogs(processedData);
        setLoading(false);
    };

    const initializeUserAndData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        let role = 'staff';
        let dept = null;
        let name = '';

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
        }

        await fetchTaskLogs(role, dept);
    };

    useEffect(() => {
        initializeUserAndData();
    }, []);

    // Helper to call notification API
    const sendNotification = async (payload: { role?: string, userIds?: string[], title: string, body: string }) => {
        try {
            const resp = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) {
                const errorData = await resp.json();
                console.error('Notification API Error:', JSON.stringify(errorData));
            }
        } catch (err) {
            console.error('Failed to send notification request', err);
        }
    };

    // Staff: Submit task with photo (pending/rejected -> submitted)
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

            // Notify Admins and Leaders of the same department
            const task = taskLogs.find(t => t.id === logId);
            const taskName = task?.task_definitions.title || 'Một công việc';
            const dept = task?.task_definitions.required_role || '';

            // Fetch leaders of this department
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

    // Admin: Approve task (submitted -> completed)
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

            // Notify Staff (Department)
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

    // Admin: Reject task (submitted -> rejected)
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

            // Notify Staff (Department)
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
            {/* Sticky Header */}
            < header className="sticky top-0 z-50 bg-[#1A2B56]/80 backdrop-blur-xl border-b border-[#c9a227]/20 px-4 md:px-8 py-4 mb-6 transition-all duration-300" >
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/manhub_logo.png"
                            alt="ManHub"
                            width={100}
                            height={40}
                            className="object-contain h-8 w-auto"
                            priority
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={subscribeToPush}
                            className={`p-2 rounded-full transition-colors ${isSubscribed ? 'bg-[#c9a227]/20 text-[#c9a227]' : 'bg-[#1e3a5f] text-[#5a7a9a] hover:text-[#f4ece0]'}`}
                            title={isSubscribed ? "Đã bật thông báo" : "Bật thông báo"}
                        >
                            {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                        </button>
                        <div className="flex items-center gap-2 pr-1">
                            <div className="h-9 w-9 bg-gradient-to-br from-[#2a4a6f] to-[#1e3a5f] rounded-full flex items-center justify-center border border-[#c9a227]/30 shadow-inner">
                                <User className="h-5 w-5 text-[#c9a227]" />
                            </div>
                            <div className="hidden sm:flex flex-col text-left">
                                <span className="text-xs font-bold capitalize truncate max-w-[100px] text-[#f4ece0]">{userName || (userRole === 'admin' ? 'Quản trị viên' : 'Nhân viên')}</span>
                                <span className="text-[9px] text-[#8a9bb0] uppercase tracking-widest font-bold">{userRole}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="p-2 bg-[#0f1c2e]/50 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all border border-[#2a4a6f]/50 group active:scale-90"
                            title="Đăng xuất"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </header >

            <main className="max-w-7xl mx-auto px-4 md:px-8">

                {activeTab === 'daily' ? (
                    <>
                        {/* Stats Summary */}
                        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AdminStats {...stats} />
                        </div>

                        {/* Task List */}
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center gap-3 mb-6">
                                <ClipboardList className="h-7 w-7 text-[#c9a227]" />
                                <h2 className="text-2xl font-black tracking-tight text-[#f4ece0]">Checklist công việc hôm nay</h2>
                            </div>

                            {areas.map(area => (
                                <div key={area} className="space-y-5">
                                    <div className="flex items-center gap-3 ml-2 group">
                                        <div className="h-2 w-2 rounded-full bg-[#c9a227] shadow-[0_0_10px_rgba(201,162,39,0.5)]" />
                                        <h3 className="text-[#8a9bb0] text-xs font-black uppercase tracking-[0.25em] group-hover:text-[#f4ece0] transition-colors">
                                            {area}
                                        </h3>
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
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <TaskManagement userRole={userRole} userDepartment={userDepartment} />
                    </div>
                )}
            </main>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f1c2e]/95 backdrop-blur-2xl border-t border-[#c9a227]/20 pb-safe">
                <div className="max-w-7xl mx-auto flex items-center justify-around p-3">
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'daily' ? 'text-[#c9a227] scale-110' : 'text-[#5a7a9a]'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${activeTab === 'daily' ? 'bg-[#c9a227]/10' : ''}`}>
                            <ClipboardList className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Checklist</span>
                    </button>

                    <button
                        onClick={() => router.push('/reception')}
                        className={`flex flex-col items-center gap-1 transition-all text-[#5a7a9a] hover:text-[#c9a227] hover:scale-110`}
                    >
                        <div className="p-2 rounded-xl">
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Sảnh / Sơ đồ</span>
                    </button>

                    <button
                        onClick={() => router.push('/barber')}
                        className={`flex flex-col items-center gap-1 transition-all text-[#5a7a9a] hover:text-[#c9a227] hover:scale-110`}
                    >
                        <div className="p-2 rounded-xl">
                            <Scissors className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Ca thợ</span>
                    </button>

                    {(userRole === 'admin' || userRole === 'leader') && (
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'admin' ? 'text-[#c9a227] scale-110' : 'text-[#5a7a9a]'}`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${activeTab === 'admin' ? 'bg-[#c9a227]/10' : ''}`}>
                                <Settings className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Cài đặt</span>
                        </button>
                    )}

                    <div className="flex flex-col items-center gap-1 text-[#5a7a9a] opacity-50">
                        <div className="p-2 rounded-xl">
                            <Clock className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Lịch sử</span>
                    </div>
                </div>
            </nav>
        </div >
    );
}
