'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { compressAndUploadImage } from '@/lib/storage';
import { Database } from '@/lib/database.types';
import {
    Plus, CheckCircle2, Clock, XCircle, Circle, Camera, Loader2, Send,
    AlertTriangle, Flag, ChevronDown, X, Check, Image as ImageIcon, Target
} from 'lucide-react';

type BarberTask = Database['public']['Tables']['barber_tasks']['Row'] & {
    assignee?: { full_name: string } | null;
    assigner?: { full_name: string } | null;
};

type UserInfo = { id: string; full_name: string; role: string };

interface BarberTaskBoardProps {
    userRole: string;
    currentUserId: string | null;
}

const PRIORITY_CONFIG = {
    high: { label: 'Cao', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '🔴' },
    medium: { label: 'TB', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: '🟡' },
    low: { label: 'Thấp', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: '🟢' },
};

const STATUS_CONFIG = {
    pending: { label: 'Chưa làm', color: 'text-[#5a7a9a]', bg: 'bg-[#1e3a5f]/50', border: 'border-[#2a4a6f]' },
    in_progress: { label: 'Đang làm', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    submitted: { label: 'Chờ duyệt', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    completed: { label: 'Hoàn thành', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    rejected: { label: 'Từ chối', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

export default function BarberTaskBoard({ userRole, currentUserId }: BarberTaskBoardProps) {
    const [tasks, setTasks] = useState<BarberTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState<UserInfo[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [submitNoteId, setSubmitNoteId] = useState<string | null>(null);
    const [submitNote, setSubmitNote] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeTaskRef = useRef<string | null>(null);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formAssignee, setFormAssignee] = useState('');
    const [formDeadline, setFormDeadline] = useState('');
    const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [creating, setCreating] = useState(false);

    const isAdmin = userRole === 'admin' || userRole === 'leader';

    const fetchTasks = async () => {
        let query = supabase
            .from('barber_tasks')
            .select('*, assignee:users!barber_tasks_assigned_to_fkey(full_name), assigner:users!barber_tasks_assigned_by_fkey(full_name)')
            .eq('assigned_date', selectedDate)
            .order('priority', { ascending: true })
            .order('created_at', { ascending: false });

        if (!isAdmin) {
            query = query.eq('assigned_to', currentUserId!);
        }

        const { data, error } = await query;
        if (error) console.error('Error fetching tasks:', error);
        if (data) setTasks(data as BarberTask[]);
        setLoading(false);
    };

    const fetchStaff = async () => {
        const { data } = await supabase
            .from('users')
            .select('id, full_name, role')
            .in('role', ['staff', 'leader'])
            .order('full_name');
        if (data) setStaffList(data);
    };

    useEffect(() => {
        fetchTasks();
        if (isAdmin) fetchStaff();

        const channel = supabase
            .channel('barber-tasks-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'barber_tasks' }, () => fetchTasks())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedDate]);

    const handleCreate = async () => {
        if (!formTitle.trim()) return;
        setCreating(true);

        const isSelf = !isAdmin || formAssignee === currentUserId;
        const assignTo = isAdmin && formAssignee ? formAssignee : currentUserId!;

        const { error } = await supabase.from('barber_tasks').insert({
            title: formTitle.trim(),
            description: formDesc.trim() || null,
            assigned_to: assignTo,
            assigned_by: currentUserId,
            assigned_date: selectedDate,
            deadline: formDeadline ? new Date(`${selectedDate}T${formDeadline}:00`).toISOString() : null,
            priority: formPriority,
            is_self_registered: isSelf,
            status: 'pending'
        });

        if (error) {
            console.error('Create error:', error);
            alert('Không thể tạo nhiệm vụ!');
        } else {
            setFormTitle(''); setFormDesc(''); setFormAssignee(''); setFormDeadline(''); setFormPriority('medium');
            setShowCreateModal(false);
            fetchTasks();
        }
        setCreating(false);
    };

    const handleStartTask = async (taskId: string) => {
        await supabase.from('barber_tasks').update({ status: 'in_progress' }).eq('id', taskId);
    };

    const handleOpenSubmit = (taskId: string) => {
        activeTaskRef.current = taskId;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const taskId = activeTaskRef.current;
        if (!file || !taskId) return;

        setUploadingId(taskId);
        try {
            const fileName = `${Date.now()}-${file.name}`;
            const path = `task-reports/${fileName}`;
            const url = await compressAndUploadImage(file, path);

            await supabase.from('barber_tasks').update({
                image_url: url,
                status: 'submitted',
            }).eq('id', taskId);

            setSubmitNoteId(taskId);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Upload ảnh thất bại!');
        }
        setUploadingId(null);
        e.target.value = '';
    };

    const handleSaveNote = async (taskId: string) => {
        if (submitNote.trim()) {
            await supabase.from('barber_tasks').update({ report_note: submitNote.trim() }).eq('id', taskId);
        }
        setSubmitNote('');
        setSubmitNoteId(null);
        fetchTasks();
    };

    const handleApprove = async (taskId: string) => {
        await supabase.from('barber_tasks').update({
            status: 'completed',
            reviewed_by: currentUserId,
            reviewed_at: new Date().toISOString()
        }).eq('id', taskId);
    };

    const handleReject = async (taskId: string) => {
        const reason = prompt('Lý do từ chối (tùy chọn):');
        await supabase.from('barber_tasks').update({
            status: 'rejected',
            reviewed_by: currentUserId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: reason || null
        }).eq('id', taskId);
    };

    const stats = {
        total: tasks.length,
        done: tasks.filter(t => t.status === 'completed').length,
        submitted: tasks.filter(t => t.status === 'submitted').length,
        pending: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#c9a227]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <input type="file" hidden ref={fileInputRef} accept="image/*" capture="environment" onChange={handleFileChange} />

            {/* Header + Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                        <Target className="h-7 w-7 text-[#c9a227]" />
                        <h2 className="text-2xl font-black tracking-tight text-[#f4ece0]">
                            {selectedDate === new Date().toISOString().split('T')[0] ? 'Nhiệm vụ hôm nay' : `Nhiệm vụ: ${selectedDate}`}
                        </h2>
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-[#0f1c2e]/60 border border-[#2a4a6f] rounded-xl px-3 py-1.5 text-sm text-[#f4ece0] outline-none"
                    />
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gold-gradient text-[#0a1120] font-bold text-sm hover:shadow-[0_0_25px_rgba(201,162,39,0.3)] transition-all active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    {isAdmin ? 'Giao việc' : 'Đăng ký việc'}
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Tổng', value: stats.total, color: 'text-[#f4ece0]' },
                    { label: 'Chờ làm', value: stats.pending, color: 'text-blue-400' },
                    { label: 'Chờ duyệt', value: stats.submitted, color: 'text-amber-400' },
                    { label: 'Hoàn thành', value: stats.done, color: 'text-green-400' },
                ].map(s => (
                    <div key={s.label} className="bg-[#0f1c2e]/60 border border-[#2a4a6f] rounded-2xl p-4 text-center">
                        <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-[#5a7a9a] mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Task List */}
            {tasks.length === 0 ? (
                <div className="bg-[#0f1c2e]/60 border border-[#2a4a6f] rounded-3xl p-16 text-center">
                    <Target className="h-12 w-12 text-[#2a4a6f] mx-auto mb-4" />
                    <p className="text-[#5a7a9a] font-bold">Chưa có nhiệm vụ nào hôm nay</p>
                    <p className="text-xs text-[#5a7a9a]/60 mt-1">{isAdmin ? 'Nhấn "Giao việc" để bắt đầu' : 'Nhấn "Đăng ký việc" để tự tạo'}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map(task => {
                        const sc = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                        const pc = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
                        const isOwner = task.assigned_to === currentUserId;
                        const canAct = isOwner && (task.status === 'pending' || task.status === 'in_progress' || task.status === 'rejected');
                        const deadlineDate = task.deadline ? new Date(task.deadline) : null;
                        const isOverdue = deadlineDate && deadlineDate < new Date() && task.status !== 'completed';

                        return (
                            <div
                                key={task.id}
                                className={`bg-[#0f1c2e]/60 border rounded-2xl p-5 transition-all ${
                                    task.status === 'completed' ? 'border-green-500/30 opacity-70' :
                                    isOverdue ? 'border-red-500/40 bg-red-500/5' :
                                    task.status === 'submitted' ? 'border-amber-500/30' :
                                    'border-[#2a4a6f] hover:border-[#c9a227]/30'
                                }`}
                            >
                                {/* Top row: status + priority */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] uppercase font-black border ${sc.bg} ${sc.border} ${sc.color}`}>
                                            {sc.label}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] uppercase font-black border ${pc.bg} ${pc.border} ${pc.color}`}>
                                            {pc.icon} {pc.label}
                                        </span>
                                        {task.is_self_registered && (
                                            <span className="px-2 py-0.5 rounded-lg text-[9px] uppercase font-black bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                                Tự đăng ký
                                            </span>
                                        )}
                                        {isOverdue && (
                                            <span className="px-2 py-0.5 rounded-lg text-[9px] uppercase font-black bg-red-500/20 border border-red-500/30 text-red-400 flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" /> Quá hạn
                                            </span>
                                        )}
                                    </div>
                                    {uploadingId === task.id && <Loader2 className="h-4 w-4 animate-spin text-[#c9a227]" />}
                                </div>

                                {/* Title + description */}
                                <h3 className={`font-bold text-base mb-1 ${task.status === 'completed' ? 'text-green-400 line-through' : 'text-[#f4ece0]'}`}>
                                    {task.title}
                                </h3>
                                {task.description && (
                                    <p className="text-sm text-[#8a9bb0] mb-3 line-clamp-2">{task.description}</p>
                                )}

                                {/* Meta info */}
                                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-[#5a7a9a] mb-3">
                                    {isAdmin && task.assignee && (
                                        <span className="bg-white/5 px-2 py-1 rounded-lg">👤 {task.assignee.full_name}</span>
                                    )}
                                    {task.assigner && !task.is_self_registered && (
                                        <span className="bg-white/5 px-2 py-1 rounded-lg">📋 Giao bởi: {task.assigner.full_name}</span>
                                    )}
                                    {deadlineDate && (
                                        <span className={`bg-white/5 px-2 py-1 rounded-lg ${isOverdue ? 'text-red-400' : ''}`}>
                                            ⏰ {deadlineDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>

                                {/* Report preview */}
                                {task.image_url && (task.status === 'submitted' || task.status === 'completed' || task.status === 'rejected') && (
                                    <div className="mb-3 flex items-center gap-3">
                                        <a href={task.image_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#c9a227] hover:underline flex items-center gap-1">
                                            <ImageIcon className="h-4 w-4" /> Xem ảnh báo cáo
                                        </a>
                                        {task.report_note && (
                                            <span className="text-xs text-[#8a9bb0] italic">&quot;{task.report_note}&quot;</span>
                                        )}
                                    </div>
                                )}

                                {/* Rejection reason */}
                                {task.status === 'rejected' && task.rejection_reason && (
                                    <p className="text-xs text-red-400 mb-3 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                        ⚠️ Lý do: {task.rejection_reason}
                                    </p>
                                )}

                                {/* Submit note modal */}
                                {submitNoteId === task.id && (
                                    <div className="mb-3 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Ghi chú báo cáo (tùy chọn)..."
                                            value={submitNote}
                                            onChange={e => setSubmitNote(e.target.value)}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f4ece0] placeholder:text-[#5a7a9a] focus:border-[#c9a227]/50 outline-none"
                                        />
                                        <button onClick={() => handleSaveNote(task.id)} className="px-4 py-2 bg-[#c9a227] text-[#0a1120] rounded-xl font-bold text-sm">
                                            Gửi
                                        </button>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 flex-wrap">
                                    {/* Staff actions */}
                                    {isOwner && task.status === 'pending' && (
                                        <button onClick={() => handleStartTask(task.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all active:scale-95">
                                            <Clock className="h-3.5 w-3.5" /> Bắt đầu
                                        </button>
                                    )}

                                    {isOwner && (task.status === 'in_progress' || task.status === 'rejected') && (
                                        <button onClick={() => handleOpenSubmit(task.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl gold-gradient text-[#0a1120] text-xs font-bold transition-all active:scale-95">
                                            <Camera className="h-3.5 w-3.5" /> Nộp báo cáo
                                        </button>
                                    )}

                                    {/* Admin review */}
                                    {isAdmin && task.status === 'submitted' && (
                                        <>
                                            <button onClick={() => handleApprove(task.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold transition-all active:scale-95">
                                                <Check className="h-3.5 w-3.5" /> Duyệt
                                            </button>
                                            <button onClick={() => handleReject(task.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all active:scale-95">
                                                <X className="h-3.5 w-3.5" /> Từ chối
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create / Assign Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-[#0f1c2e] border border-[#c9a227]/20 rounded-3xl w-full max-w-md p-6 space-y-5 animate-in slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-[#f4ece0]">{isAdmin ? '📋 Giao việc mới' : '✋ Đăng ký việc'}</h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                <X className="h-5 w-5 text-[#5a7a9a]" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1.5">Tiêu đề *</label>
                                <input
                                    value={formTitle}
                                    onChange={e => setFormTitle(e.target.value)}
                                    placeholder="VD: Dọn kho, xếp hàng hóa..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] placeholder:text-[#5a7a9a]/50 focus:border-[#c9a227]/50 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1.5">Mô tả</label>
                                <textarea
                                    value={formDesc}
                                    onChange={e => setFormDesc(e.target.value)}
                                    placeholder="Chi tiết công việc cần làm..."
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] placeholder:text-[#5a7a9a]/50 focus:border-[#c9a227]/50 outline-none resize-none"
                                />
                            </div>

                            {isAdmin && (
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1.5">Giao cho *</label>
                                    <select
                                        value={formAssignee}
                                        onChange={e => setFormAssignee(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] focus:border-[#c9a227]/50 outline-none"
                                    >
                                        <option value="">Chọn thợ</option>
                                        {staffList.map(s => (
                                            <option key={s.id} value={s.id}>{s.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1.5">Deadline</label>
                                    <input
                                        type="time"
                                        value={formDeadline}
                                        onChange={e => setFormDeadline(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] focus:border-[#c9a227]/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1.5">Mức ưu tiên</label>
                                    <select
                                        value={formPriority}
                                        onChange={e => setFormPriority(e.target.value as any)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] focus:border-[#c9a227]/50 outline-none"
                                    >
                                        <option value="low">🟢 Thấp</option>
                                        <option value="medium">🟡 Trung bình</option>
                                        <option value="high">🔴 Cao</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={creating || !formTitle.trim() || (isAdmin && !formAssignee)}
                            className="w-full gold-gradient text-[#0a1120] font-black text-base py-4 rounded-2xl hover:shadow-[0_0_30px_rgba(201,162,39,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            {creating ? 'Đang tạo...' : (isAdmin ? 'Giao việc' : 'Đăng ký')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
