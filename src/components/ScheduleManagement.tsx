'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, ChevronLeft, ChevronRight, User as UserIcon, Clock, Copy, CalendarDays } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

interface WorkSchedule {
    id: string;
    user_id: string;
    date: string;
    shift: string;
}

interface UserProfile {
    id: string;
    full_name: string;
    role: string;
    username: string;
}

const SHIFT_CYCLE = ['Ca 1', 'Ca 2', 'Full', 'OFF'];

export default function ScheduleManagement({ userRole }: { userRole: string, currentUserId: string | null }) {
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [schedules, setSchedules] = useState<{ [key: string]: WorkSchedule }>({});
    const [loading, setLoading] = useState(true);
    const [updatingParams, setUpdatingParams] = useState<string | null>(null);
    const [isCopying, setIsCopying] = useState(false);

    const isAdmin = userRole === 'admin' || userRole === 'leader';
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

    useEffect(() => {
        fetchWeeklyData();
    }, [currentWeekStart]);

    const fetchWeeklyData = async () => {
        setLoading(true);
        const startDateStr = format(currentWeekStart, 'yyyy-MM-dd');
        const endDateStr = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        
        try {
            // Include barbers from 'barber' department or those that start with BBR
            const { data: userData } = await supabase
                .from('users')
                .select('id, full_name, role, username')
                .or('department.eq.barber,username.ilike.bbr%')
                .order('username');

            if (userData) setUsers(userData);

            const { data: scheduleData } = await supabase
                .from('work_schedules')
                .select('*')
                .gte('date', startDateStr)
                .lte('date', endDateStr);

            if (scheduleData) {
                const scheduleMap: { [key: string]: WorkSchedule } = {};
                scheduleData.forEach(s => {
                    scheduleMap[`${s.user_id}_${s.date}`] = s;
                });
                setSchedules(scheduleMap);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = async (userId: string, dateObj: Date) => {
        if (!isAdmin) return;
        
        const dateStr = format(dateObj, 'yyyy-MM-dd');
        const key = `${userId}_${dateStr}`;
        const currentRecord = schedules[key];
        const currentShift = currentRecord?.shift || '';
        
        // Find next shift in cycle or empty
        let nextShift = 'Ca 1';
        if (currentShift) {
            const idx = SHIFT_CYCLE.indexOf(currentShift);
            if (idx === -1 || idx === SHIFT_CYCLE.length - 1) {
                nextShift = ''; // Turn to empty (delete)
            } else {
                nextShift = SHIFT_CYCLE[idx + 1];
            }
        }

        setUpdatingParams(key);

        try {
            if (!nextShift) {
                // Delete
                if (currentRecord) {
                    await supabase.from('work_schedules').delete().eq('id', currentRecord.id);
                    setSchedules(prev => {
                        const newMap = {...prev};
                        delete newMap[key];
                        return newMap;
                    });
                }
            } else if (currentRecord) {
                // Update
                await supabase.from('work_schedules').update({ shift: nextShift }).eq('id', currentRecord.id);
                setSchedules(prev => ({...prev, [key]: { ...prev[key], shift: nextShift }}));
            } else {
                // Insert
                const { data } = await supabase.from('work_schedules').insert([{
                    user_id: userId,
                    date: dateStr,
                    shift: nextShift
                }]).select().single();
                
                if (data) {
                    setSchedules(prev => ({...prev, [key]: data}));
                }
            }
        } catch (e) {
            console.error('Error updating shift:', e);
        } finally {
            setUpdatingParams(null);
        }
    };

    const handleCopySchedule = async (weeksToCopy: number) => {
        if (!isAdmin) return;
        const currentData = Object.values(schedules);
        if (currentData.length === 0) {
            alert('Tuần này chưa có lịch làm việc nào để sao chép!');
            return;
        }

        if (!confirm(`Bạn có chắc muốn sao chép toàn bộ lịch làm việc của tuần này cho ${weeksToCopy === 1 ? 'tuần tiếp theo' : '4 tuần (1 tháng) tiếp theo'}?`)) {
            return;
        }

        setIsCopying(true);
        try {
            const inserts = [];
            for (let w = 1; w <= weeksToCopy; w++) {
                for (const s of currentData) {
                    const originalDate = new Date(s.date);
                    const newDate = format(addDays(originalDate, w * 7), 'yyyy-MM-dd');
                    inserts.push({
                        user_id: s.user_id,
                        date: newDate,
                        shift: s.shift
                    });
                }
            }

            const { error } = await supabase
                .from('work_schedules')
                .upsert(inserts, { onConflict: 'user_id, date' });

            if (error) {
                console.error('Error copying schedules:', error);
                alert('Có lỗi xảy ra khi sao chép lịch!');
            } else {
                alert('Đã sao chép lịch làm việc thành công!');
            }
        } catch (e) {
            console.error('Exception copying schedules:', e);
        } finally {
            setIsCopying(false);
        }
    };

    const getBaseColorForShift = (shift: string) => {
        if (shift.includes('Ca 1')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        if (shift.includes('Ca 2')) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
        if (shift.includes('Full')) return 'bg-green-500/20 text-green-300 border-green-500/30';
        if (shift.includes('OFF')) return 'bg-red-500/20 text-red-300 border-red-500/30';
        return 'bg-[#0f1c2e] border-dashed border-[#2a4a6f] hover:border-[#c9a227]/50';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header section with Week Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0f1c2e]/60 p-6 rounded-3xl border border-[#c9a227]/20 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#2a4a6f] to-[#1e3a5f] border border-[#c9a227]/30 flex items-center justify-center shadow-lg">
                        <Calendar className="h-7 w-7 text-[#c9a227]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#f4ece0] tracking-tight">Lịch Tuần</h2>
                        <p className="text-sm text-[#8a9bb0] uppercase tracking-wider font-semibold">Quản lý tổng quan lịch làm việc của Barber</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {isAdmin && (
                        <div className="flex items-center gap-2 mr-4 border-r border-[#2a4a6f]/50 pr-6">
                            <button
                                onClick={() => handleCopySchedule(1)}
                                disabled={isCopying}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#1a2d47] hover:bg-[#2a4a6f] border border-[#2a4a6f]/50 rounded-xl text-[#8a9bb0] hover:text-[#c9a227] transition-all text-xs font-bold tracking-wider disabled:opacity-50"
                                title="Nhân bản lịch này cho 1 tuần tiếp theo"
                            >
                                <Copy className="w-4 h-4" />
                                <span className="hidden xl:inline">S.Chép sang Tuần Sau</span>
                            </button>
                            <button
                                onClick={() => handleCopySchedule(4)}
                                disabled={isCopying}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#1a2d47] hover:bg-[#2a4a6f] border border-[#2a4a6f]/50 rounded-xl text-[#8a9bb0] hover:text-[#c9a227] transition-all text-xs font-bold tracking-wider disabled:opacity-50"
                                title="Nhân bản nguyên lịch này cho 4 tuần (1 tháng) tiếp theo"
                            >
                                <CalendarDays className="w-4 h-4" />
                                <span className="hidden xl:inline">S.Chép 1 Tháng Tới</span>
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-3 bg-[#1a2d47] p-2 rounded-2xl border border-[#2a4a6f]/50">
                        <button 
                            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                            className="p-3 hover:bg-[#2a4a6f] rounded-xl text-[#8a9bb0] hover:text-[#c9a227] transition-all"
                        >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-48 text-center text-sm font-bold text-[#f4ece0] tracking-widest">
                        {format(currentWeekStart, 'dd/MM')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'dd/MM/yyyy')}
                    </div>
                    <button 
                         onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                        className="p-3 hover:bg-[#2a4a6f] rounded-xl text-[#8a9bb0] hover:text-[#c9a227] transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="h-10 w-10 rounded-full border-4 border-t-[#c9a227] border-[#2a4a6f] animate-spin"></div>
                </div>
            ) : (
                <div className="bg-[#1A2B56]/50 rounded-3xl border border-[#c9a227]/20 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#0f1c2e] text-xs uppercase text-[#8a9bb0] tracking-widest border-b border-[#2a4a6f]/50">
                                <tr>
                                    <th className="px-6 py-5 font-black flex items-center gap-2">
                                        <UserIcon className="w-4 h-4 text-[#c9a227]" />
                                        Nhân Sự
                                    </th>
                                    {weekDays.map(day => (
                                        <th key={day.toISOString()} className={`px-4 py-5 text-center font-bold ${isSameDay(day, new Date()) ? 'text-[#c9a227]' : ''}`}>
                                            <span className="block mb-1">{format(day, 'EEEE', { locale: vi })}</span>
                                            <span className="text-[10px] bg-[#1a2d47] px-2 py-1 rounded-md">{format(day, 'dd/MM')}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a4a6f]/30">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-[#1a2d47]/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-[#f4ece0] truncate max-w-[150px] sm:max-w-[200px]" title={user.full_name}>
                                                {user.full_name}
                                            </div>
                                            <div className="text-xs text-[#8a9bb0] font-mono mt-1 uppercase">
                                                {user.username}
                                            </div>
                                        </td>
                                        {weekDays.map(day => {
                                            const dateStr = format(day, 'yyyy-MM-dd');
                                            const key = `${user.id}_${dateStr}`;
                                            const schedule = schedules[key];
                                            const isUpdating = updatingParams === key;
                                            const shiftLabel = schedule?.shift;

                                            return (
                                                <td key={dateStr} className="px-2 py-4">
                                                    <div 
                                                        onClick={() => handleCellClick(user.id, day)}
                                                        className={`
                                                            h-12 flex flex-col items-center justify-center rounded-xl border transition-all duration-200 select-none
                                                            ${isAdmin ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
                                                            ${shiftLabel ? getBaseColorForShift(shiftLabel) : getBaseColorForShift('') }
                                                            ${isUpdating ? 'opacity-50 animate-pulse' : ''}
                                                        `}
                                                    >
                                                        {shiftLabel ? (
                                                            <span className="font-black text-sm tracking-wide">{shiftLabel}</span>
                                                        ) : (
                                                            <span className="text-[#2a4a6f] text-lg font-black">+</span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-[#8a9bb0]">
                                            Chưa có dữ liệu nhân sự.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {isAdmin && (
                <div className="text-right text-xs text-[#8a9bb0] font-medium flex items-center justify-end gap-2 bg-[#1a2d47]/30 p-3 rounded-xl inline-block ml-auto border border-[#2a4a6f]/30">
                    Nhấp vào các ô trống để luân chuyển: 
                    <span className="text-blue-400 font-bold ml-1">Ca 1</span> → 
                    <span className="text-orange-400 font-bold ml-1">Ca 2</span> → 
                    <span className="text-green-400 font-bold ml-1">Full</span> → 
                    <span className="text-red-400 font-bold ml-1">OFF</span> → Trống
                </div>
            )}
        </div>
    );
}
