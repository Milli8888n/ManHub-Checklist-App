'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Trash2,
    Save,
    X,
    AlertTriangle,
    ShieldAlert,
    Ban
} from 'lucide-react';

interface ViolationLog {
    id: string;
    description: string;
    severity: 'warning' | 'penalty';
    penalty_amount: number;
    created_at: string;
    user: { full_name: string, username: string };
    recorded_by_user?: { full_name: string };
}

interface UserData {
    id: string;
    username: string;
    full_name: string;
}

interface ViolationManagementProps {
    currentUserId: string | null;
    onNotify?: (payload: { role?: string, userIds?: string[], title: string, body: string }) => Promise<void>;
}

export default function ViolationManagement({ currentUserId, onNotify }: ViolationManagementProps) {
    const [violations, setViolations] = useState<ViolationLog[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        user_id: '',
        description: '',
        severity: 'warning' as 'warning' | 'penalty'
    });

    const fetchData = async () => {
        setLoading(true);

        const [usersRes, violationsRes] = await Promise.all([
            supabase.from('users').select('id, username, full_name').order('username'),
            supabase.from('violations_log').select(`
                id, description, severity, penalty_amount, created_at,
                user:users!violations_log_user_id_fkey(full_name, username),
                recorded_by_user:users!violations_log_recorded_by_fkey(full_name)
            `).order('created_at', { ascending: false })
        ]);

        if (!usersRes.error) setUsers(usersRes.data || []);
        
        if (!violationsRes.error) {
            // Mapping nested joins
            const formatted = (violationsRes.data || []).map(v => ({
                ...v,
                user: v.user as unknown as { full_name: string, username: string },
                recorded_by_user: v.recorded_by_user as unknown as { full_name: string } || undefined
            }));
            setViolations(formatted);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        if (!formData.user_id || !formData.description) {
            alert('Vui lòng chọn nhân viên và nhập lỗi vi phạm!');
            return;
        }

        const payload = {
            user_id: formData.user_id,
            recorded_by: currentUserId,
            description: formData.description,
            severity: formData.severity,
            penalty_amount: formData.severity === 'penalty' ? 50000 : 0
        };

        const { error } = await supabase.from('violations_log').insert([payload]);
        
        if (!error) {
            // Send Notification
            if (onNotify) {
                const user = users.find(u => u.id === formData.user_id);
                const title = payload.severity === 'penalty' ? 'THÔNG BÁO PHẠT KỶ LUẬT' : 'NHẮC NHỞ VI PHẠM';
                const body = `${payload.severity === 'penalty' ? 'Bạn bị phạt 50.000đ. ' : ''}Lý do: ${payload.description}`;
                onNotify({
                    userIds: [payload.user_id],
                    title,
                    body
                });
            }

            setIsAdding(false);
            setFormData({ user_id: '', description: '', severity: 'warning' });
            fetchData();
        } else {
            console.error(error);
            alert('Lỗi khi lưu vi phạm!');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa lượt vi phạm này? (Hoàn tác phạt)')) {
            const { error } = await supabase.from('violations_log').delete().eq('id', id);
            if (!error) fetchData();
        }
    };

    if (loading && violations.length === 0) {
        return <div className="p-8 text-center text-zinc-500">Đang tải danh sách vi phạm...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-black flex items-center gap-2 md:gap-3 text-red-500">
                    <ShieldAlert className="h-6 w-6 md:h-7 md:w-7" />
                    Kỷ Luật & Phạt
                </h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20 active:scale-95 text-xs md:text-sm"
                >
                    <Plus className="h-4 w-4 md:h-5 md:w-5" />
                    Thêm Vi Phạm
                </button>
            </div>

            {/* Add Form Overlay */}
            {isAdding && (
                <div className="bg-zinc-900/95 border border-zinc-800 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-red-400">
                            Ghi nhận vi phạm
                        </h3>
                        <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white p-2">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Nhân viên vi phạm</label>
                            <select
                                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 focus:border-red-500 focus:outline-none transition-all appearance-none"
                                value={formData.user_id}
                                onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                            >
                                <option value="">-- Chọn nhân viên --</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.username} - {u.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Mức độ</label>
                            <select
                                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 focus:border-red-500 focus:outline-none transition-all appearance-none"
                                value={formData.severity}
                                onChange={e => setFormData({ ...formData, severity: e.target.value as 'warning' | 'penalty' })}
                            >
                                <option value="warning">Nhắc nhở (Thẻ vàng)</option>
                                <option value="penalty">Phạt 50,000đ (Lần 3)</option>
                            </select>
                        </div>
                        
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Mô tả lỗi vi phạm</label>
                            <textarea
                                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 focus:border-red-500 focus:outline-none transition-all h-24"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="VD: Để đọng nước ở bồn gội, Quét nhà không sạch..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-6 py-3 rounded-2xl font-bold bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-3 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Save className="h-5 w-5" />
                            Ghi nhận
                        </button>
                    </div>
                </div>
            )}

            {/* Violation List Grid */}
            <div className="grid grid-cols-1 gap-4">
                {violations.map(v => (
                    <div key={v.id} className="bg-zinc-900/40 border border-zinc-800 p-4 md:p-5 rounded-2xl md:rounded-3xl flex flex-col md:flex-row md:items-center justify-between group hover:bg-zinc-900/60 transition-all gap-4">
                        <div className="flex items-start md:items-center gap-4 flex-1 min-w-0">
                            <div className={`p-3 rounded-xl shrink-0 ${v.severity === 'penalty' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {v.severity === 'penalty' ? <Ban className="h-5 w-5 md:h-6 md:w-6" /> : <AlertTriangle className="h-5 w-5 md:h-6 md:w-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-bold text-zinc-100 text-base">{v.user?.full_name}</h4>
                                    <span className="text-[10px] uppercase font-black text-zinc-500">
                                        ({v.user?.username})
                                    </span>
                                    {v.severity === 'penalty' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/20">
                                            -50K phạt
                                        </span>
                                    )}
                                </div>
                                <p className="text-zinc-400 text-sm">{v.description}</p>
                                <p className="text-zinc-600 text-xs mt-1">
                                    {new Date(v.created_at).toLocaleString('vi-VN')}
                                    {v.recorded_by_user && ` • Ghi nhận bởi: ${v.recorded_by_user.full_name}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                            <button
                                onClick={() => handleDelete(v.id)}
                                aria-label="Xóa"
                                className="p-2 md:p-2.5 bg-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg md:rounded-xl transition-all border border-zinc-700 active:scale-90"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
                
                {violations.length === 0 && !loading && (
                    <div className="text-center p-12 glass rounded-3xl border border-white/5">
                        <AlertTriangle className="h-12 w-12 text-[#5a7a9a] mx-auto mb-4 opacity-50" />
                        <p className="text-[#8a9bb0] font-bold">Chưa có bản ghi vi phạm nào</p>
                    </div>
                )}
            </div>
        </div>
    );
}
