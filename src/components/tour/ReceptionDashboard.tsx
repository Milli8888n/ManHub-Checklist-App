'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { sortBarbers } from '@/lib/queue-algorithm';
import { User, Scissors, Coffee, Clock, CheckCircle, Home, Layout, Sparkles, BarChart3, Users } from 'lucide-react';
import SeatMap from './SeatMap';
import { useRouter } from 'next/navigation';

type BarberStatusWithUser = Database['public']['Tables']['barber_status']['Row'] & {
    users: {
        full_name: string | null;
        username: string | null;
    } | null;
};

export default function ReceptionDashboard() {
    const [barbers, setBarbers] = useState<BarberStatusWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchBarbers = async () => {
        const { data, error } = await supabase
            .from('barber_status')
            .select('*, users(full_name, username)');

        if (!error && data) {
            setBarbers(data as BarberStatusWithUser[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBarbers();

        const channel = supabase
            .channel('reception-view')
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

            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-[#c9a227]/10 px-4 md:px-8 py-5 mb-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => router.push('/')}
                            className="p-3 bg-white/5 hover:bg-[#c9a227]/10 rounded-2xl border border-white/5 transition-all active:scale-90 group"
                        >
                            <Home className="w-5 h-5 text-[#c9a227] group-hover:scale-110 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-[#f4ece0] flex items-center gap-3">
                                <span className="text-gold">QUẢN LÝ SẢNH</span>
                                <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
                                <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#8a9bb0] hidden md:block">Operations</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-4 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/5">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase font-black tracking-widest text-[#8a9bb0]">Đang trực</span>
                                <span className="text-sm font-black text-green-400">{barbers.filter(b => b.state === 'available').length} thợ rảnh</span>
                            </div>
                            <div className="w-3 h-3 rounded-full bg-green-500 pulse-gold" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
                {/* Visual Seat Map Section */}
                <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="glass-card p-8 md:p-12 rounded-[3rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-12">
                            <Scissors className="w-64 h-64" />
                        </div>
                        <SeatMap />
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Queue Column */}
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
                                    <p className="text-[#5a7a9a] font-bold italic">Không có thợ nào đang trong ca trực...</p>
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
                                                        <span className="text-[10px] text-[#5a7a9a] font-bold">WAIT: 12m</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${barber.state === 'available' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        barber.state === 'busy' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                            'bg-white/5 text-[#5a7a9a] border-white/5'
                                                    }`}>
                                                    {barber.state}
                                                </span>

                                                {barber.state === 'available' && index === 0 && (
                                                    <button
                                                        onClick={() => handleAssign(barber.user_id)}
                                                        className="gold-gradient text-[#0a1120] font-black px-8 py-3.5 rounded-2xl hover:shadow-[0_0_30px_rgba(201,162,39,0.3)] transition-all flex items-center gap-3 active:scale-95 whitespace-nowrap"
                                                    >
                                                        <CheckCircle className="w-5 h-5 stroke-[3px]" />
                                                        GÁN KHÁCH NGAY
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats/Summary Sidebar */}
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
        </div>
    );
}
