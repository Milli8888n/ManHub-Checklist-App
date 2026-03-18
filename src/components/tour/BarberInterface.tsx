'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { Play, Check, Plus, Trash2, Clock, User, Home, Sparkles, LogOut, Scissors, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

type BarberStatus = Database['public']['Tables']['barber_status']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type ServiceSession = Database['public']['Tables']['service_sessions']['Row'];

export default function BarberInterface() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [status, setStatus] = useState<BarberStatus | null>(null);
    const [session, setSession] = useState<ServiceSession | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user);
                fetchStatus(user.id);
                fetchServices();
            } else {
                router.push('/login');
            }
        };
        checkUser();
    }, []);

    const fetchStatus = async (userId: string) => {
        const { data } = await supabase
            .from('barber_status')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (data) {
            setStatus(data);
            if (data.current_session_id) {
                fetchSession(data.current_session_id);
            }
        } else {
            const { data: newData } = await supabase
                .from('barber_status')
                .insert({ user_id: userId, state: 'offline' })
                .select()
                .single();
            if (newData) setStatus(newData);
        }
        setLoading(false);
    };

    const fetchSession = async (sessionId: string) => {
        const { data } = await supabase
            .from('service_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();
        setSession(data);
    };

    const fetchServices = async () => {
        const { data } = await supabase.from('services').select('*').eq('is_active', true);
        if (data) setServices(data);
    };

    useEffect(() => {
        if (!currentUser) return;
        const channel = supabase
            .channel(`barber-${currentUser.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'barber_status', filter: `user_id=eq.${currentUser.id}` }, (payload) => {
                setStatus(payload.new as BarberStatus);
                if (payload.new.current_session_id) {
                    fetchSession(payload.new.current_session_id);
                } else {
                    setSession(null);
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser]);

    const handleStartService = async () => {
        if (!status || !status.current_session_id) return;
        await supabase.from('service_sessions').update({
            status: 'in_progress',
            start_time: new Date().toISOString()
        }).eq('id', status.current_session_id);
        await supabase.from('barber_status').update({ state: 'busy' }).eq('user_id', currentUser.id);
    };

    const handleFinishService = async () => {
        if (!status || !status.current_session_id) return;
        const now = new Date().toISOString();
        await supabase.from('service_sessions').update({ status: 'completed', end_time: now }).eq('id', status.current_session_id);
        await supabase.from('barber_status').update({
            state: 'cooldown',
            current_session_id: null,
            last_completed_at: now
        }).eq('user_id', currentUser.id);
        setSession(null);
        setSelectedServices([]);
    };

    const toggleStatus = async () => {
        if (!status) return;
        const nextState = status.state === 'offline' ? 'available' : 'offline';
        const { data } = await supabase
            .from('barber_status')
            .update({ state: nextState, check_in_time: nextState === 'available' ? new Date().toISOString() : status.check_in_time })
            .eq('user_id', currentUser.id)
            .select()
            .single();
        if (data) setStatus(data);
    };

    const toggleService = (service: Service) => {
        if (selectedServices.find(s => s.id === service.id)) {
            setSelectedServices(selectedServices.filter(s => s.id !== service.id));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#0a1120] text-[#f4ece0]">
            <div className="animate-float flex flex-col items-center gap-6">
                <Scissors className="w-16 h-16 text-gold animate-pulse" />
                <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full gold-gradient animate-[progress_1.5s_infinite]"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a1120] text-[#f4ece0] font-sans pb-10 selection:bg-gold/30">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-[#c9a227]/10 px-4 py-3">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2.5 bg-white/5 hover:bg-gold/10 rounded-xl border border-white/5 transition-all active:scale-90"
                        >
                            <Home className="w-5 h-5 text-gold" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight leading-none text-gold">CA LÀM VIỆC</h1>
                            <p className="text-[9px] text-[#8a9bb0] uppercase font-black tracking-widest mt-1.5 opacity-70">
                                {status?.station_label || 'CHƯA ĐẶT GHẾ'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={toggleStatus}
                        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${status?.state === 'available' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]' :
                                status?.state === 'busy' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-white/5 text-[#8a9bb0] border-white/10'
                            }`}
                    >
                        {status?.state === 'offline' ? 'Bắt đầu ca' : status?.state}
                    </button>
                </div>
            </header>

            <main className="max-w-md mx-auto p-5 space-y-8">
                {/* STATUS CARDS */}
                {(status?.state === 'available' || status?.state === 'offline') && (
                    <div className="h-[450px] flex flex-col items-center justify-center glass-card rounded-[3rem] text-center p-12 animate-in fade-in zoom-in duration-700 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gold/[0.02] -z-10 animate-pulse"></div>
                        <div className="relative mb-8">
                            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 rotate-12 group-hover:rotate-0 transition-transform">
                                <Clock className="w-10 h-10 text-[#5a7a9a] opacity-40" />
                            </div>
                            <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-gold animate-bounce" />
                        </div>
                        <h2 className="text-3xl font-black mb-3 tracking-tight">
                            {status?.state === 'offline' ? 'Bạn đang nghỉ' : 'Đang đợi khách'}
                        </h2>
                        <p className="text-[#8a9bb0] text-sm font-medium leading-relaxed">
                            {status?.state === 'offline'
                                ? 'Nhấn nút phía trên để bắt đầu ca làm việc và nhận khách.'
                                : 'Hệ thống AI đang điều phối khách. Bạn sẽ nhận được thông báo ngay khi đến lượt.'}
                        </p>
                    </div>
                )}

                {(status?.state === 'consulting' || status?.state === 'busy') && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                        {/* Current Guest Panel */}
                        <div className="gold-gradient p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(201,162,39,0.2)] text-[#0a1120] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <Star className="w-32 h-32 fill-current" />
                            </div>

                            <div className="relative">
                                <div className="flex items-start justify-between mb-10">
                                    <div>
                                        <p className="text-[#0a1120]/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Đang phục vụ</p>
                                        <h2 className="text-5xl font-black tracking-tight leading-none truncate max-w-[200px]">
                                            {session?.guest_name || 'Khách'}
                                        </h2>
                                    </div>
                                    <div className="w-16 h-16 bg-[#0a1120]/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
                                        <User className="w-8 h-8" />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    {status.state === 'consulting' ? (
                                        <button
                                            onClick={handleStartService}
                                            className="flex-1 bg-[#0a1120] text-gold py-5 rounded-[2rem] font-black text-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 group"
                                        >
                                            <Play className="w-7 h-7 fill-current group-hover:scale-110 transition-transform" /> BẮT ĐẦU
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleFinishService}
                                            className="flex-1 bg-[#0a1120] text-green-400 py-5 rounded-[2rem] font-black text-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 group"
                                        >
                                            <Check className="w-7 h-7 stroke-[4px] group-hover:scale-110 transition-transform" /> HOÀN THÀNH
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Service Selection */}
                        <div className="glass-card p-8 rounded-[3rem] shadow-xl">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gold/10 rounded-2xl">
                                        <Scissors className="w-5 h-5 text-gold" />
                                    </div>
                                    <h3 className="font-black text-xl tracking-tight">Dịch vụ</h3>
                                </div>
                                <span className="text-[10px] font-black text-[#5a7a9a] uppercase tracking-widest">
                                    {selectedServices.length} đã chọn
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {services.map(svc => (
                                    <button
                                        key={svc.id}
                                        onClick={() => toggleService(svc)}
                                        className={`group p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between ${selectedServices.find(s => s.id === svc.id)
                                                ? 'bg-gold border-gold text-[#0a1120] shadow-[0_10px_20px_rgba(201,162,39,0.2)]'
                                                : 'bg-white/5 border-white/5 text-[#f4ece0] hover:border-gold/30'
                                            }`}
                                    >
                                        <div className="flex flex-col text-left">
                                            <span className="font-black text-base">{svc.name}</span>
                                            <span className={`text-[10px] font-bold tracking-wider mt-0.5 ${selectedServices.find(s => s.id === svc.id) ? 'text-[#0a1120]/60' : 'text-gold'
                                                }`}>
                                                {svc.price.toLocaleString()}đ
                                            </span>
                                        </div>
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${selectedServices.find(s => s.id === svc.id)
                                                ? 'bg-[#0a1120]/10'
                                                : 'bg-white/5 opacity-40 group-hover:bg-gold/10'
                                            }`}>
                                            {selectedServices.find(s => s.id === svc.id) ? (
                                                <Check className="w-4 h-4 stroke-[4px]" />
                                            ) : (
                                                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {status?.state === 'cooldown' && (
                    <div className="glass-card p-12 rounded-[3.5rem] text-center space-y-8 animate-in zoom-in duration-700 border-gold/30 relative overflow-hidden">
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-gold/5 blur-[50px] rounded-full"></div>
                        <div className="w-24 h-24 gold-gradient rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl rotate-6">
                            <Sparkles className="w-12 h-12 text-[#0a1120]" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black tracking-tight">Xong tua!</h2>
                            <p className="text-[#8a9bb0] font-medium leading-relaxed">
                                Bạn đã hoàn thành phục vụ. Hãy dành ít phút dọn dẹp và nghỉ ngơi trước khi bắt đầu tua tiếp theo.
                            </p>
                        </div>
                        <button
                            onClick={() => supabase.from('barber_status').update({ state: 'available' }).eq('user_id', currentUser.id)}
                            className="w-full gold-gradient text-[#0a1120] py-5 rounded-[2rem] font-black text-xl hover:shadow-[0_20px_40px_rgba(201,162,39,0.3)] transition-all active:scale-95"
                        >
                            SẴN SÀNG NGAY
                        </button>
                    </div>
                )}

                {/* Account Summary */}
                <div className="glass p-6 rounded-[2.5rem] border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                <User className="w-6 h-6 text-gold" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-[#8a9bb0] font-black uppercase tracking-widest leading-none mb-1">Tài khoản</span>
                                <span className="text-sm font-bold truncate max-w-[120px]">{currentUser.email?.split('@')[0]}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-3 rounded-2xl border border-red-500/20 transition-all active:scale-90"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
