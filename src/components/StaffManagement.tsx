'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Plus, Trash2, Edit3, X, Check, Search } from 'lucide-react';

interface UserProfile {
    id: string;
    username: string;
    full_name: string;
    role: string;
    department: string;
    password_hash?: string;
}

export default function StaffManagement() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        role: 'staff',
        department: 'barber',
        password_hash: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('users')
            .select('id, username, full_name, role, department')
            .order('username');
            
        if (data && !error) {
            setUsers(data);
        }
        setLoading(false);
    };

    const handleOpenModal = (user: UserProfile | null = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username || '',
                full_name: user.full_name || '',
                role: user.role || 'staff',
                department: user.department || 'barber',
                password_hash: '' // leave empty, only update if filled
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                full_name: '',
                role: 'staff',
                department: 'barber',
                password_hash: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const payload: any = {
                username: formData.username,
                full_name: formData.full_name,
                role: formData.role,
                department: formData.department
            };

            if (formData.password_hash) {
                payload.password_hash = formData.password_hash;
            }

            if (editingUser) {
                const { error } = await supabase
                    .from('users')
                    .update(payload)
                    .eq('id', editingUser.id);
                if (error) throw error;
                alert('Cập nhật nhân sự thành công!');
            } else {
                if (!formData.password_hash) {
                    alert('Vui lòng nhập mật khẩu cho người dùng mới (password_hash). Nó sẽ được lưu raw cho hệ thống đăng nhập.');
                    setIsSaving(false);
                    return;
                }
                const { error } = await supabase
                    .from('users')
                    .insert([payload]);
                if (error) throw error;
                alert('Thêm nhân sự thành công!');
            }
            
            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert('Có lỗi xảy ra: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (user: UserProfile) => {
        if (!confirm(`Bạn có chắc muốn xóa nhân sự ${user.full_name} (${user.username})?`)) return;
        
        try {
            // Cascade manually if needed or expect db to handle it
            const { error } = await supabase.from('users').delete().eq('id', user.id);
            if (error) {
                if (error.message.includes('foreign key constraint')) {
                    alert('Không thể xóa nhân sự này vì họ đã có dữ liệu ràng buộc (lịch làm việc, checklist). Hãy xóa dữ liệu liên quan trước, hoặc chỉ cần đổi mật khẩu để khóa tài khoản.');
                } else {
                    throw error;
                }
            } else {
                fetchUsers();
            }
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert('Lỗi: ' + error.message);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0f1c2e] p-6 rounded-3xl border border-[#c9a227]/20 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-[#1a2d47] border border-[#2a4a6f] flex items-center justify-center">
                        <User className="h-6 w-6 text-[#c9a227]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#f4ece0]">Quản lý Nhân Sự</h2>
                        <p className="text-sm text-[#8a9bb0]">Danh sách tài khoản nội bộ ManHub</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9bb0]" />
                        <input 
                            type="text" 
                            placeholder="Tìm tên hoặc mã NV..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-[#1a2d47] border border-[#2a4a6f] rounded-xl text-sm text-[#f4ece0] placeholder-[#8a9bb0] focus:ring-1 focus:ring-[#c9a227] focus:border-[#c9a227] transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#c9a227] hover:bg-[#b08d20] text-[#0f1c2e] rounded-xl font-bold transition-all shadow-md active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Thêm Mới</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-4 border-t-[#c9a227] border-[#2a4a6f] animate-spin"></div></div>
            ) : (
                <div className="bg-[#0f1c2e] rounded-2xl border border-[#2a4a6f]/50 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1a2d47] text-[#8a9bb0] text-sm uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold border-b border-[#2a4a6f]">Mã NV (Username)</th>
                                    <th className="px-6 py-4 font-semibold border-b border-[#2a4a6f]">Họ Tên</th>
                                    <th className="px-6 py-4 font-semibold border-b border-[#2a4a6f]">Vai trò</th>
                                    <th className="px-6 py-4 font-semibold border-b border-[#2a4a6f] text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a4a6f]/30">
                                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-[#1a2d47]/50 transition-colors">
                                        <td className="px-6 py-4 text-[#f4ece0] font-mono">{user.username}</td>
                                        <td className="px-6 py-4 font-bold text-[#f4ece0]">{user.full_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 
                                                user.role === 'leader' ? 'bg-orange-500/20 text-orange-400' : 
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {user.role}
                                            </span>
                                            <span className="ml-2 px-3 py-1 rounded-full text-xs font-bold uppercase bg-stone-500/20 text-stone-400">
                                                {user.department}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleOpenModal(user)} className="p-2 text-[#8a9bb0] hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Sửa">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(user)} className="p-2 text-[#8a9bb0] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Xóa">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-[#8a9bb0]">Không tìm thấy nhân sự phù hợp.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0f1c2e] w-full max-w-lg rounded-3xl border border-[#c9a227]/30 shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-[#2a4a6f] flex items-center justify-between bg-[#1a2d47]">
                            <h3 className="text-lg font-bold text-[#f4ece0]">{editingUser ? 'Chỉnh Sửa Nhân Sự' : 'Thêm Mới Nhân Sự'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-[#8a9bb0] hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-4 flex-1 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-[#8a9bb0] mb-1">Tên đăng nhập (Username)</label>
                                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-[#1a2d47] border border-[#2a4a6f] rounded-xl px-4 py-2.5 text-[#f4ece0] focus:ring-1 focus:ring-[#c9a227] focus:border-[#c9a227] transition-colors" placeholder="VD: bbr011" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#8a9bb0] mb-1">Mật khẩu (Ghi đè)</label>
                                <input type="text" value={formData.password_hash} onChange={e => setFormData({...formData, password_hash: e.target.value})} className="w-full bg-[#1a2d47] border border-[#2a4a6f] rounded-xl px-4 py-2.5 text-[#f4ece0] focus:ring-1 focus:ring-[#c9a227] focus:border-[#c9a227] transition-colors" placeholder={editingUser ? "Để trống nếu không đổi Mk" : "Bắt buộc nhập Mk"} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#8a9bb0] mb-1">Họ và tên</label>
                                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-[#1a2d47] border border-[#2a4a6f] rounded-xl px-4 py-2.5 text-[#f4ece0] focus:ring-1 focus:ring-[#c9a227] focus:border-[#c9a227] transition-colors" placeholder="Nguyễn Văn A" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#8a9bb0] mb-1">Quyền hạn</label>
                                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-[#1a2d47] border border-[#2a4a6f] rounded-xl px-4 py-2.5 text-[#f4ece0] outline-none">
                                        <option value="staff">Nhân viên</option>
                                        <option value="leader">Trưởng nhóm</option>
                                        <option value="admin">Quản trị viên</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#8a9bb0] mb-1">Bộ phận</label>
                                    <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-[#1a2d47] border border-[#2a4a6f] rounded-xl px-4 py-2.5 text-[#f4ece0] outline-none">
                                        <option value="barber">Barber</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-[#2a4a6f] flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-[#8a9bb0] hover:text-white hover:bg-[#2a4a6f] transition-colors">
                                    Hủy
                                </button>
                                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[#0f1c2e] bg-[#c9a227] hover:bg-[#b08d20] transition-colors disabled:opacity-50">
                                    {isSaving ? 'Đang lưu...' : (
                                        <><Check className="w-5 h-5"/> Lưu Lại</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
