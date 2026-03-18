'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { User, Clock, Scissors, Calendar, Sparkles, ChevronRight } from 'lucide-react';

type BarberStatus = Database['public']['Tables']['barber_status']['Row'] & {
    users: {
        full_name: string | null;
    } | null;
    current_session?: Database['public']['Tables']['service_sessions']['Row'] | null;
};

type Booking = Database['public']['Tables']['bookings']['Row'];

export default function SeatMap() {
    const [barbers, setBarbers] = useState<BarberStatus[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        fetchBarbers();
        fetchBookings();

        const statusChannel = supabase.channel('seat-map-status')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'barber_status' }, () => fetchBarbers())
            .subscribe();

        return () => { supabase.removeChannel(statusChannel); }
    }, []);

    const fetchBarbers = async () => {
        const { data: barberData } = await supabase
            .from('barber_status')
            .select('*, users(full_name)')
            .order('station_label', { ascending: true });

        if (barberData) {
            const busyBarberIds = barberData.filter(b => b.current_session_id).map(b => b.current_session_id);
            let sessionsMap: any = {};
            if (busyBarberIds.length > 0) {
                const { data: sessions } = await supabase
                    .from('service_sessions')
                    .select('*')
                    .in('id', busyBarberIds as string[]);
                sessions?.forEach(s => sessionsMap[s.id] = s);
            }
            const enriched = barberData.map((b: any) => ({
                ...b,
                current_session: b.current_session_id ? sessionsMap[b.current_session_id] : null
            }));
            setBarbers(enriched as BarberStatus[]);
        }
    };

    const fetchBookings = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data } = await supabase
            .from('bookings')
            .select('*')
            .gte('booking_time', today.toISOString())
            .order('booking_time', { ascending: true });
        if (data) setBookings(data);
    };

    const getNextBooking = (barberId: string) => {
        const now = new Date().getTime();
        return bookings.find(b =>
            b.assigned_barber_id === barberId &&
            new Date(b.booking_time).getTime() > now &&
            b.status !== 'cancelled'
        );
    };

    const getTimeRemaining = (endTimeStr: string | null) => {
        if (!endTimeStr) return null;
        const end = new Date(endTimeStr).getTime();
        const now = new Date().getTime();
        const diff = Math.ceil((end - now) / 60000);
        return diff > 0 ? diff : 0;
    };

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-4">
                        <span className="text-gold">SƠ ĐỒ GHẾ TRỰC TIẾP</span>
                        <Sparkles className="w-6 h-6 text-gold animate-pulse" />
                    </h2>
                    <p className="text-[#8a9bb0] text-sm mt-1 uppercase tracking-[0.2em] font-bold">Real-time Station Monitoring</p>
                </div>

                <div className="flex bg-white/5 p-2 rounded-2xl border border-white/5 gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[10px] font-black uppercase text-green-400">Rảnh</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[10px] font-black uppercase text-red-400">Đang làm</span>
                    </div>
                </div>
            </div>

            {barbers.length === 0 ? (
                <div className="h-64 glass rounded-[2.5rem] flex flex-col items-center justify-center text-[#5a7a9a] border-dashed border-2 border-white/10">
                    <User className="w-12 h-12 mb-4 opacity-10" />
                    <p className="font-bold italic">Đang tải sơ đồ sảnh...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {barbers.map((barber) => {
                        const nextBooking = getNextBooking(barber.user_id);
                        const remaining = barber.current_session?.expected_end_time
                            ? getTimeRemaining(barber.current_session.expected_end_time)
                            : null;

                        const isBookingSoon = nextBooking &&
                            (new Date(nextBooking.booking_time).getTime() - Date.now() < 30 * 60000);

                        const isLocked = barber.state === 'available' && isBookingSoon;

                        return (
                            <div key={barber.user_id} className={`
                                relative p-8 rounded-[3rem] border-2 flex flex-col justify-between min-h-[240px] transition-all duration-500 group cursor-pointer
                                ${barber.state === 'busy' ? 'bg-red-500/[0.03] border-red-500/20 shadow-[0_20px_50px_rgba(239,68,68,0.05)]' :
                                    barber.state === 'consulting' ? 'bg-amber-500/[0.03] border-amber-500/20 shadow-[0_20px_50px_rgba(245,158,11,0.05)]' :
                                        'bg-white/[0.03] border-white/10 hover:border-gold/30 shadow-2xl'}
                                ${isLocked ? 'border-gold !bg-gold/5 shadow-[0_0_50px_rgba(201,162,39,0.1)]' : ''}
                            `}>
                                {/* Floating Badge */}
                                <div className="absolute -top-3 right-8">
                                    <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full backdrop-blur-3xl border shadow-xl ${isLocked ? 'bg-gold text-[#0a1120] border-gold' :
                                            barber.state === 'busy' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                'bg-white/10 text-[#8a9bb0] border-white/10'
                                        }`}>
                                        {isLocked ? 'Reserved' : (barber.state === 'available' ? 'Sẵn sàng' : barber.state)}
                                    </span>
                                </div>

                                {/* Station Title */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-[10px] text-gold font-black uppercase tracking-[0.2em] group-hover:scale-105 transition-transform origin-left">
                                            {barber.station_label || 'Station ?'}
                                        </div>
                                    </div>
                                    <h3 className="font-black text-3xl text-[#f4ece0] tracking-tighter">
                                        {barber.users?.full_name?.split(' ').pop()}
                                    </h3>
                                </div>

                                {/* Session Details (Active Only) */}
                                {(barber.state === 'busy' || barber.state === 'consulting') && (
                                    <div className="my-6 space-y-3 animate-in fade-in duration-500">
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-[#5a7a9a] font-black uppercase tracking-widest">Khách hàng</p>
                                            <p className="font-bold text-base text-[#f4ece0] flex items-center gap-2">
                                                {barber.current_session?.guest_name || 'Khách vãng lai'}
                                                <ChevronRight className="w-3 h-3 text-gold" />
                                            </p>
                                        </div>
                                        {remaining !== null && (
                                            <div className={`flex items-center gap-2 font-black text-3xl ${remaining <= 5 ? 'text-red-500 animate-pulse' : 'text-gold'}`}>
                                                <Clock className="w-5 h-5 stroke-[3px]" />
                                                {remaining}m
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Footer Status Info */}
                                <div className="mt-auto flex items-center gap-3 pt-6 border-t border-white/5">
                                    {isLocked ? (
                                        <div className="flex items-center gap-3 text-gold text-xs font-black uppercase tracking-widest">
                                            <Calendar className="w-4 h-4" />
                                            <span>Sắp tới lịch hẹn</span>
                                        </div>
                                    ) : barber.state === 'available' ? (
                                        <div className="flex items-center gap-3 text-green-400 text-xs font-black uppercase tracking-widest">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span>Đang đợi khách</span>
                                        </div>
                                    ) : nextBooking ? (
                                        <div className="flex items-center gap-2 text-[#5a7a9a] text-[10px] font-bold">
                                            <Calendar className="w-3 h-3" />
                                            <span className="text-white/40">{new Date(nextBooking.booking_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
