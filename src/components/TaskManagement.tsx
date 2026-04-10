'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    CheckCircle2,
    AlertCircle,
    FileText,
    MapPin,
    Clock,
    Camera
} from 'lucide-react';

interface TaskDefinition {
    id: string;
    title: string;
    description: string;
    area: string;
    required_role: string;
    is_photo_required: boolean;
    shift: string;
}

interface TaskManagementProps {
    userRole: string;
    userDepartment: string | null;
}

export default function TaskManagement({ userRole, userDepartment }: TaskManagementProps) {
    const [tasks, setTasks] = useState<TaskDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<TaskDefinition>>({
        title: '',
        description: '',
        area: userRole === 'leader' && userDepartment ? (userDepartment.charAt(0).toUpperCase() + userDepartment.slice(1)) : 'Barber',
        required_role: userRole === 'leader' && userDepartment ? userDepartment : 'staff',
        is_photo_required: false,
        shift: 'all'
    });

    const fetchTasks = async () => {
        setLoading(true);
        let query = supabase
            .from('task_definitions')
            .select('*');

        if (userRole === 'leader' && userDepartment) {
            query = query.eq('required_role', userDepartment);
        }

        const { data, error } = await query.order('area', { ascending: true });

        if (!error) setTasks(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleSave = async (id?: string) => {
        if (id) {
            // Update
            const { error } = await supabase
                .from('task_definitions')
                .update(formData)
                .eq('id', id);
            if (!error) {
                setEditingId(null);
                fetchTasks();
            }
        } else {
            // Create
            const { error } = await supabase
                .from('task_definitions')
                .insert([formData]);
            if (!error) {
                setIsAdding(false);
                setFormData({
                    title: '',
                    description: '',
                    area: userRole === 'leader' && userDepartment ? (userDepartment.charAt(0).toUpperCase() + userDepartment.slice(1)) : 'Barber',
                    required_role: userRole === 'leader' && userDepartment ? userDepartment : 'staff',
                    is_photo_required: false,
                    shift: 'all'
                });
                fetchTasks();
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa đầu việc này?')) {
            const { error } = await supabase
                .from('task_definitions')
                .delete()
                .eq('id', id);
            if (!error) fetchTasks();
        }
    };

    const startEdit = (task: TaskDefinition) => {
        setEditingId(task.id);
        setFormData(task);
    };

    if (loading && tasks.length === 0) {
        return <div className="p-8 text-center text-zinc-500">Đang tải danh sách đầu việc...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-black flex items-center gap-2 md:gap-3">
                    <FileText className="text-blue-500 h-6 w-6 md:h-7 md:w-7" />
                    Quản lý Công việc
                </h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95 text-xs md:text-sm"
                >
                    <Plus className="h-4 w-4 md:h-5 md:w-5" />
                    Thêm công việc
                </button>
            </div>

            {/* Add Form Overlay */}
            {(isAdding || editingId) && (
                <div className="bg-zinc-900/95 border border-zinc-800 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            {isAdding ? 'Thêm mới' : 'Chỉnh sửa'} đầu việc
                        </h3>
                        <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-zinc-500 hover:text-white p-2">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Tên công việc</label>
                            <input
                                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 focus:border-blue-500 focus:outline-none transition-all"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="VD: Lau sạch bụi bàn ghế"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Khu vực</label>
                            <select
                                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 focus:border-blue-500 focus:outline-none transition-all appearance-none"
                                value={formData.area}
                                onChange={e => setFormData({ ...formData, area: e.target.value })}
                            >
                                {userRole === 'admin' ? (
                                    <>
                                        <option value="Barber">Barber</option>
                                        <option value="Toilet">Toilet</option>
                                        <option value="Khu vực chung">Khu vực chung</option>
                                    </>
                                ) : (
                                    <option value={(userDepartment || 'Phòng ban')?.charAt(0).toUpperCase() + (userDepartment || 'Phòng ban')?.slice(1)}>
                                        {(userDepartment || 'Phòng ban')?.charAt(0).toUpperCase() + (userDepartment || 'Phòng ban')?.slice(1)}
                                    </option>
                                )}
                            </select>
                        </div>
                        {userRole === 'admin' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Phòng ban phụ trách</label>
                                <select
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 focus:border-blue-500 focus:outline-none transition-all appearance-none"
                                    value={formData.required_role}
                                    onChange={e => setFormData({ ...formData, required_role: e.target.value })}
                                >
                                    <option value="staff">Tất cả</option>
                                    <option value="barber">Barber</option>
                                </select>
                            </div>
                        )}
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Mô tả/Hướng dẫn</label>
                            <textarea
                                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3.5 text-zinc-100 focus:border-blue-500 focus:outline-none transition-all h-24"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Hướng dẫn chi tiết cách thực hiện..."
                            />
                        </div>
                        <div className="flex items-center gap-4 py-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.is_photo_required}
                                    onChange={e => setFormData({ ...formData, is_photo_required: e.target.checked })}
                                />
                                <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.is_photo_required ? 'bg-blue-600 border-blue-600' : 'border-zinc-700 group-hover:border-zinc-500'}`}>
                                    {formData.is_photo_required && <CheckCircle2 className="h-4 w-4 text-white" />}
                                </div>
                                <span className="text-sm font-bold text-zinc-300">Bắt buộc chụp ảnh xác minh</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            onClick={() => { setIsAdding(false); setEditingId(null); }}
                            className="px-6 py-3 rounded-2xl font-bold bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={() => handleSave(editingId || undefined)}
                            className="px-8 py-3 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Save className="h-5 w-5" />
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            )}

            {/* Task List Grid */}
            <div className="grid grid-cols-1 gap-4">
                {tasks.map(task => (
                    <div key={task.id} className="bg-zinc-900/40 border border-zinc-800 p-3.5 md:p-5 rounded-2xl md:rounded-3xl flex items-center justify-between group hover:bg-zinc-900/60 transition-all">
                        <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
                            <div className="bg-zinc-800 p-2.5 md:p-3 rounded-xl md:rounded-2xl shrink-0">
                                <MapPin className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 md:mb-1 flex-wrap">
                                    <h4 className="font-bold text-zinc-100 text-sm md:text-base truncate">{task.title}</h4>
                                    <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded-full border border-zinc-700">
                                        {task.area}
                                    </span>
                                    {task.is_photo_required && (
                                        <Camera className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                </div>
                                <p className="text-zinc-500 text-sm line-clamp-1">{task.description}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 md:gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => startEdit(task)}
                                aria-label="Chỉnh sửa"
                                className="p-2 md:p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-blue-400 rounded-lg md:rounded-xl transition-all border border-zinc-700 active:scale-90"
                            >
                                <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(task.id)}
                                aria-label="Xóa"
                                className="p-2 md:p-2.5 bg-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg md:rounded-xl transition-all border border-zinc-700 active:scale-90"
                            >
                                <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
