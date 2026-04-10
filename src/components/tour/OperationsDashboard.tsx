'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { sortBarbers, isShiftActive } from '@/lib/queue-algorithm';
import { User, Scissors, Coffee, Clock, CheckCircle, Home, Layout, Sparkles, BarChart3, Users } from 'lucide-react';
import SeatMap from './SeatMap';
import { useRouter } from 'next/navigation';
import GlobalNav from '../GlobalNav';
import AppHeader from '../AppHeader';

type BarberStatusWithUser = Database['public']['Tables']['barber_status']['Row'] & {
    users: {
        full_name: string | null;
        username: string | null;
    } | null;
};

type ServiceSessionWithUser = Database['public']['Tables']['service_sessions']['Row'] & {
    users: {
        full_name: string | null;
        username: string | null;
    } | null;
};

export default function OperationsDashboard() {
    const [barbers, setBarbers] = useState<BarberStatusWithUser[]>([]);
    const [sessions, setSessions] = useState<ServiceSessionWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>('staff');
    const router = useRouter();

    const fetchBarbers = async () => {
        const now = new Date();
        const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        
        // 1. Fetch all statuses
        const { data: statusData, error: statusError } = await supabase
            .from('barber_status')
            .select('*, users(full_name, username)');

        // 2. Fetch today's schedules
        const { data: scheduleData } = await supabase
            .from('work_schedules')
            .select('user_id, shift')
            .eq('date', todayStr);

        if (statusError) {
            console.error('Status Error:', statusError);
        }

        if (!statusError && statusData && scheduleData) {
            // 3. Filter by shift timing
            const activeUserIds = scheduleData
                .filter(s => isShiftActive(s.shift, now))
                .map(s => s.user_id);

            const filteredBarbers = (statusData as BarberStatusWithUser[])
                .filter(b => activeUserIds.includes(b.user_id));

            setBarbers(filteredBarbers);
        }

        // 4. Fetch today's completed/cancelled sessions for history
        const { data: sessionData } = await supabase
            .from('service_sessions')
            .select('*, users!service_sessions_barber_id_fkey(full_name, username)')
            .eq('status', 'completed')
            .gte('start_time', todayStr + 'T00:00:00Z')
            .order('end_time', { ascending: false });

        if (sessionData) setSessions(sessionData as ServiceSessionWithUser[]);
        
        setLoading(false);
    };

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();
            if (userData) setUserRole(userData.role);
        };

        checkAuth();
        fetchBarbers();

        const channel = supabase
            .channel('operations-view')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'barber_status' },
                () => fetchBarbers()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const sortedBarbers = sortBarbers([...barbers]);

    const handleAssign = async (barberId: string) => {
        const { data: session, error: sessionError } = await supabase
            .from('service_sessions')
            .insert({
                barber_id: barberId,
                status: 'consulting',
                start_time: new Date().toISOString(),
                customer_type: 'walk_in'
            })
            .select()
            .single();

        if (sessionError) {
            alert('Lỗi khởi tạo phiên làm việc');
            return;
        }

        await supabase
            .from('barber_status')
            .update({ state: 'consulting', current_session_id: session.id })
            .eq('user_id', barberId);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a1120] text-[#f4ece0]">
                <div className="flex flex-col items-center gap-6 animate-float">
                    <div className="relative">
                        <Layout className="h-16 w-16 text-[#c9a227] animate-pulse" />
                        <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-[#c9a227] animate-bounce" />
                    </div>
                    <div className="h-1 w-48 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#c9a227] animate-[progress_2s_ease-in-out_infinite]" style={{ width: '30%' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a1120] text-[#f4ece0] font-sans selection:bg-[#c9a227]/30 pb-20" >
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#c9a227]/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#c9a227]/5 blur-[100px] rounded-full"></div>
            </div>

            {/* Shared App Header */}
            <AppHeader />

            {/* Contextual Sub-header */}
            <div className="px-4 md:px-8 py-4 mb-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1 className="text-2xl font-black tracking-tight text-[#f4ece0] flex items-center gap-3">
                        <span className="text-gold">QUẢN LÝ SẢNH</span>
                        <div className="h-5 w-[1px] bg-white/10 hidden md:block"></div>
                        <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#8a9bb0] hidden md:block">Operations</span>
                    </h1>
                    <div className="flex items-center gap-4 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/5">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-black tracking-widest text-[#8a9bb0]">Đang trực</span>
                            <span className="text-sm font-black text-green-400">{barbers.filter(b => b.state === 'available').length} thợ rảnh</span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-green-500 pulse-gold" />
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
                <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="glass-card p-8 md:p-12 rounded-[3rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-12">
                            <Scissors className="w-64 h-64" />
                        </div>
                        <SeatMap />
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#c9a227]/10 rounded-2xl">
                                    <Clock className="w-6 h-6 text-[#c9a227]" />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight">Thứ tự ưu tiên</h2>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#5a7a9a]">Đã sắp xếp bởi AI</span>
                        </div>

                        <div className="glass-card rounded-[2.5rem] overflow-hidden">
                            {sortedBarbers.length === 0 ? (
                                <div className="p-20 text-center flex flex-col items-center gap-4">
                                    <Users className="w-12 h-12 text-white/5" />
                                    <p className="text-[#5a7a9a] font-bold italic">Hiện không có thợ trong ca trực (08:30 - 20:30)</p>
                                    <p className="text-xs text-[#5a7a9a]/60">Lịch ca hôm nay đã được thiết lập. Thợ sẽ xuất hiện khi vào ca làm việc.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {sortedBarbers.map((barber, index) => (
                                        <div
                                            key={barber.user_id}
                                            className={`group p-8 flex items-center justify-between transition-all hover:bg-white/[0.02] ${barber.state !== 'available' ? 'opacity-30' : ''}`}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-2xl transition-all group-hover:scale-110 shadow-2xl ${index === 0 && barber.state === 'available'
                                                        ? 'gold-gradient text-[#0a1120] rotate-3'
                                                        : 'bg-white/5 text-[#8a9bb0]'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-xl text-[#f4ece0] group-hover:text-gold transition-colors">
                                                        {barber.users?.full_name || barber.users?.username}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-[10px] text-gold font-black uppercase tracking-widest">
                                                            {barber.station_label || 'CHƯA ĐẶT GHẾ'}
                                                        </span>
                                                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                                                        <span className="text-[10px] text-[#5a7a9a] font-bold">
                                                            WAIT: {Math.floor((Date.now() - new Date(barber.last_completed_at || barber.check_in_time || Date.now()).getTime()) / 60000)}m
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${barber.state === 'available' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        barber.state === 'busy' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                            barber.state === 'offline' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                                'bg-white/5 text-[#5a7a9a] border-white/5'
                                                    }`}>
                                                    {barber.state === 'offline' ? 'CHƯA VÀO CA' : barber.state}
                                                </span>

                                                {barber.state === 'available' && index === 0 && userRole === 'admin' && (
                                                    <button
                                                        onClick={() => handleAssign(barber.user_id)}
                                                        className="gold-gradient text-[#0a1120] font-black px-8 py-3.5 rounded-2xl hover:shadow-[0_0_30px_rgba(201,162,39,0.3)] transition-all flex items-center gap-3 active:scale-95 whitespace-nowrap"
                                                    >
                                                        <CheckCircle className="w-5 h-5 stroke-[3px]" />
                                                        GÁN KHÁCH (ADMIN)
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Session History Section */}
                    <div className="lg:col-span-2 space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                         <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-2xl">
                                    <Clock className="w-6 h-6 text-blue-400" />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight">Lịch sử phục vụ hôm nay</h2>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#5a7a9a]">{sessions.length} lượt khách</span>
                        </div>

                        <div className="glass-card rounded-[2.5rem] overflow-hidden">
                            {sessions.length === 0 ? (
                                <div className="p-12 text-center text-[#5a7a9a] italic font-bold">Chưa có lượt phục vụ hoàn thành hôm nay</div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {sessions.map(s => (
                                        <div key={s.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-bold text-xs text-[#8a9bb0]">
                                                    {new Date(s.end_time || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-[#f4ece0]">{s.users?.full_name || s.users?.username}</h4>
                                                        <p className="text-[10px] uppercase font-bold text-[#5a7a9a] tracking-widest mt-0.5">
                                                            {s.guest_name ? `Khách: ${s.guest_name}` : s.customer_type} • Premium Service
                                                        </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-green-400">DONE</span>
                                                <p className="text-[10px] text-[#5a7a9a] font-bold mt-0.5">
                                                    {s.end_time && s.start_time && Math.floor((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000)}m
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-[1.2s]">
                        <div className="flex items-center gap-4 px-2">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                <BarChart3 className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight">Thống kê</h2>
                        </div>

                        <div className="glass-card p-10 rounded-[3rem] space-y-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Sparkles className="w-20 h-20 text-gold" />
                            </div>

                            <div className="space-y-3">
                                <p className="text-[#8a9bb0] text-[10px] uppercase font-black tracking-[0.2em]">Tổng nhân sự trực</p>
                                <div className="text-6xl font-black text-[#f4ece0] tracking-tighter">{barbers.length}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                <div>
                                    <p className="text-[#5a7a9a] text-[10px] uppercase font-black tracking-widest mb-2">Đã phục vụ</p>
                                    <div className="text-3xl font-black text-[#f4ece0]">{sessions.length}</div>
                                </div>
                                <div>
                                    <p className="text-[#5a7a9a] text-[10px] uppercase font-black tracking-widest mb-2">Hiệu suất</p>
                                    <div className="text-3xl font-black text-[#c9a227]">
                                        {barbers.length > 0 ? Math.round((sessions.length / barbers.length) * 10) / 10 : 0} <span className="text-xs text-[#5a7a9a]">L/T</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <p className="text-[#8a9bb0] text-[10px] uppercase font-black tracking-[0.2em]">Sử dụng ghế</p>
                                    <span className="text-2xl font-black text-gold">
                                        {barbers.length > 0 ? Math.round((barbers.filter(b => b.state === 'busy').length / barbers.length) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full gold-gradient shadow-[0_0_15px_rgba(201,162,39,0.5)] transition-all duration-1000"
                                        style={{ width: `${barbers.length > 0 ? (barbers.filter(b => b.state === 'busy').length / barbers.length) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5 flex items-center gap-3 text-[#5a7a9a] text-xs font-bold">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                <span>Dữ liệu thời gian thực</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <GlobalNav activeTab="operations" userRole={userRole} />
        </div>
    );
}
