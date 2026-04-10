'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import {
    Package, Plus, Minus, ArrowUpDown, AlertTriangle, Search,
    X, Loader2, Edit3, Trash2, TrendingUp, TrendingDown, RotateCcw, History
} from 'lucide-react';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
type InventoryLog = Database['public']['Tables']['inventory_logs']['Row'] & {
    users?: { full_name: string } | null;
    inventory_items?: { name: string } | null;
};

interface Props {
    userRole: string;
    currentUserId: string | null;
}

const CATEGORIES = [
    { value: 'hair_product', label: 'Sản phẩm tóc' },
    { value: 'tool', label: 'Dụng cụ' },
    { value: 'consumable', label: 'Vật tư tiêu hao' },
    { value: 'cleaning', label: 'Vệ sinh' },
    { value: 'other', label: 'Khác' },
];

const UNITS = ['cái', 'chai', 'hộp', 'gói', 'cuộn', 'bộ', 'tuýp', 'lọ', 'kg', 'lít'];

const ACTION_LABELS: Record<string, { label: string; color: string; icon: any }> = {
    import: { label: 'Nhập kho', color: 'text-green-400', icon: TrendingUp },
    export: { label: 'Xuất kho', color: 'text-red-400', icon: TrendingDown },
    adjust: { label: 'Điều chỉnh', color: 'text-blue-400', icon: RotateCcw },
    use: { label: 'Sử dụng', color: 'text-amber-400', icon: Minus },
};

export default function InventoryManagement({ userRole, currentUserId }: Props) {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showLowStock, setShowLowStock] = useState(false);
    const [activeView, setActiveView] = useState<'items' | 'history'>('items');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [stockItem, setStockItem] = useState<InventoryItem | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formCategory, setFormCategory] = useState('other');
    const [formUnit, setFormUnit] = useState('cái');
    const [formQuantity, setFormQuantity] = useState(0);
    const [formMinQty, setFormMinQty] = useState(5);
    const [formCost, setFormCost] = useState(0);
    const [formSell, setFormSell] = useState(0);
    const [formNotes, setFormNotes] = useState('');

    // Stock adjustment form
    const [stockAction, setStockAction] = useState<'import' | 'export' | 'adjust' | 'use'>('import');
    const [stockQty, setStockQty] = useState(1);
    const [stockReason, setStockReason] = useState('');

    const isAdmin = userRole === 'admin' || userRole === 'leader';

    const fetchItems = async () => {
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('is_active', true)
            .order('category')
            .order('name');
        if (data) setItems(data);
        if (error) console.error('Error fetching inventory:', error);
        setLoading(false);
    };

    const fetchLogs = async () => {
        const { data } = await supabase
            .from('inventory_logs')
            .select('*, users:performed_by(full_name), inventory_items:item_id(name)')
            .order('created_at', { ascending: false })
            .limit(50);
        if (data) setLogs(data as InventoryLog[]);
    };

    useEffect(() => {
        fetchItems();
        fetchLogs();
    }, []);

    // Filter logic
    const filtered = items.filter(item => {
        if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterCategory !== 'all' && item.category !== filterCategory) return false;
        if (showLowStock && item.quantity > item.min_quantity) return false;
        return true;
    });

    const lowStockCount = items.filter(i => i.quantity <= i.min_quantity).length;

    const resetForm = () => {
        setFormName(''); setFormCategory('other'); setFormUnit('cái');
        setFormQuantity(0); setFormMinQty(5); setFormCost(0); setFormSell(0); setFormNotes('');
        setEditingItem(null);
    };

    const openAddModal = (item?: InventoryItem) => {
        if (item) {
            setEditingItem(item);
            setFormName(item.name);
            setFormCategory(item.category);
            setFormUnit(item.unit);
            setFormQuantity(item.quantity);
            setFormMinQty(item.min_quantity);
            setFormCost(item.cost_price || 0);
            setFormSell(item.sell_price || 0);
            setFormNotes(item.notes || '');
        } else {
            resetForm();
        }
        setShowAddModal(true);
    };

    const handleSaveItem = async () => {
        if (!formName.trim()) return;
        setSaving(true);

        if (editingItem) {
            const { error } = await supabase.from('inventory_items').update({
                name: formName.trim(),
                category: formCategory,
                unit: formUnit,
                min_quantity: formMinQty,
                cost_price: formCost,
                sell_price: formSell,
                notes: formNotes.trim() || null,
                updated_at: new Date().toISOString()
            }).eq('id', editingItem.id);
            if (error) alert('Lỗi cập nhật!');
        } else {
            const { error } = await supabase.from('inventory_items').insert({
                name: formName.trim(),
                category: formCategory,
                unit: formUnit,
                quantity: formQuantity,
                min_quantity: formMinQty,
                cost_price: formCost,
                sell_price: formSell,
                notes: formNotes.trim() || null,
            });
            if (error) {
                console.error(error);
                alert('Lỗi thêm sản phẩm!');
            }
        }

        setSaving(false);
        setShowAddModal(false);
        resetForm();
        fetchItems();
        fetchLogs();
    };

    const handleDelete = async (item: InventoryItem) => {
        if (!confirm(`Xóa "${item.name}" khỏi kho?`)) return;
        await supabase.from('inventory_items').update({ is_active: false }).eq('id', item.id);
        fetchItems();
    };

    const openStockModal = (item: InventoryItem, action: 'import' | 'export' | 'adjust' | 'use') => {
        setStockItem(item);
        setStockAction(action);
        setStockQty(1);
        setStockReason('');
        setShowStockModal(true);
    };

    const handleStockChange = async () => {
        if (!stockItem || stockQty <= 0) return;
        setSaving(true);

        let change = stockQty;
        if (stockAction === 'export' || stockAction === 'use') change = -stockQty;

        const newQty = stockAction === 'adjust' ? stockQty : stockItem.quantity + change;
        if (newQty < 0) {
            alert('Số lượng không đủ trong kho!');
            setSaving(false);
            return;
        }

        const adjustChange = stockAction === 'adjust' ? (stockQty - stockItem.quantity) : change;

        // Update item quantity
        await supabase.from('inventory_items').update({
            quantity: newQty,
            updated_at: new Date().toISOString()
        }).eq('id', stockItem.id);

        // Log the change
        await supabase.from('inventory_logs').insert({
            item_id: stockItem.id,
            action: stockAction,
            quantity_change: adjustChange,
            quantity_after: newQty,
            reason: stockReason.trim() || null,
            performed_by: currentUserId,
        });

        setSaving(false);
        setShowStockModal(false);
        fetchItems();
        fetchLogs();
    };

    const formatPrice = (n: number | null) => {
        if (!n) return '—';
        return n.toLocaleString('vi-VN') + 'đ';
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Package className="h-7 w-7 text-[#c9a227]" />
                    <h2 className="text-2xl font-black tracking-tight text-[#f4ece0]">Quản lý Tồn kho</h2>
                </div>
                {isAdmin && (
                    <button onClick={() => openAddModal()} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gold-gradient text-[#0a1120] font-bold text-sm hover:shadow-[0_0_25px_rgba(201,162,39,0.3)] transition-all active:scale-95">
                        <Plus className="h-4 w-4" /> Thêm sản phẩm
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Tổng SP', value: items.length, color: 'text-[#f4ece0]' },
                    { label: 'Sắp hết', value: lowStockCount, color: lowStockCount > 0 ? 'text-red-400' : 'text-green-400' },
                    { label: 'Giá trị kho', value: formatPrice(items.reduce((sum, i) => sum + (i.cost_price || 0) * i.quantity, 0)), color: 'text-[#c9a227]', isText: true },
                    { label: 'Danh mục', value: new Set(items.map(i => i.category)).size, color: 'text-blue-400' },
                ].map(s => (
                    <div key={s.label} className="bg-[#0f1c2e]/60 border border-[#2a4a6f] rounded-2xl p-4 text-center">
                        <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-[#5a7a9a] mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* View toggle + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex bg-[#0f1c2e]/80 p-1 rounded-xl border border-[#2a4a6f]">
                    <button onClick={() => setActiveView('items')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeView === 'items' ? 'bg-[#c9a227] text-[#0a1120]' : 'text-[#5a7a9a]'}`}>
                        <Package className="h-4 w-4 inline mr-1" /> Sản phẩm
                    </button>
                    <button onClick={() => setActiveView('history')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeView === 'history' ? 'bg-[#c9a227] text-[#0a1120]' : 'text-[#5a7a9a]'}`}>
                        <History className="h-4 w-4 inline mr-1" /> Lịch sử
                    </button>
                </div>

                {activeView === 'items' && (
                    <>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a7a9a]" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm..."
                                className="w-full bg-[#0f1c2e]/60 border border-[#2a4a6f] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#f4ece0] placeholder:text-[#5a7a9a]/50 focus:border-[#c9a227]/50 outline-none"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="bg-[#0f1c2e]/60 border border-[#2a4a6f] rounded-xl px-4 py-2.5 text-sm text-[#f4ece0] outline-none"
                        >
                            <option value="all">Tất cả</option>
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                        {lowStockCount > 0 && (
                            <button
                                onClick={() => setShowLowStock(!showLowStock)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${showLowStock ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-[#0f1c2e]/60 border-[#2a4a6f] text-[#5a7a9a]'}`}
                            >
                                <AlertTriangle className="h-3.5 w-3.5" /> Sắp hết ({lowStockCount})
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Items List */}
            {activeView === 'items' && (
                filtered.length === 0 ? (
                    <div className="bg-[#0f1c2e]/60 border border-[#2a4a6f] rounded-3xl p-16 text-center">
                        <Package className="h-12 w-12 text-[#2a4a6f] mx-auto mb-4" />
                        <p className="text-[#5a7a9a] font-bold">Chưa có sản phẩm nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(item => {
                            const isLow = item.quantity <= item.min_quantity;
                            const catLabel = CATEGORIES.find(c => c.value === item.category)?.label || item.category;
                            return (
                                <div key={item.id} className={`bg-[#0f1c2e]/60 border rounded-2xl p-5 transition-all ${isLow ? 'border-red-500/40 bg-red-500/5' : 'border-[#2a4a6f] hover:border-[#c9a227]/30'}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-[#f4ece0] text-base">{item.name}</h3>
                                            <span className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] bg-white/5 px-2 py-0.5 rounded-lg">{catLabel}</span>
                                        </div>
                                        {isLow && <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse" />}
                                    </div>

                                    <div className="flex items-end justify-between mb-4">
                                        <div>
                                            <div className={`text-3xl font-black ${isLow ? 'text-red-400' : 'text-[#c9a227]'}`}>
                                                {item.quantity}
                                            </div>
                                            <span className="text-[10px] text-[#5a7a9a] font-bold uppercase">{item.unit} • Min: {item.min_quantity}</span>
                                        </div>
                                        <div className="text-right text-[10px] text-[#5a7a9a] font-bold">
                                            {item.cost_price ? <div>Giá nhập: {formatPrice(item.cost_price)}</div> : null}
                                            {item.sell_price ? <div>Giá bán: {formatPrice(item.sell_price)}</div> : null}
                                        </div>
                                    </div>

                                    {item.notes && <p className="text-xs text-[#5a7a9a] mb-3 italic">{item.notes}</p>}

                                    <div className="flex gap-2 flex-wrap">
                                        {isAdmin && (
                                            <>
                                                <button onClick={() => openStockModal(item, 'import')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold hover:bg-green-500/20 transition-all active:scale-95">
                                                    <Plus className="h-3 w-3" /> Nhập
                                                </button>
                                                <button onClick={() => openStockModal(item, 'export')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold hover:bg-red-500/20 transition-all active:scale-95">
                                                    <Minus className="h-3 w-3" /> Xuất
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => openStockModal(item, 'use')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold hover:bg-amber-500/20 transition-all active:scale-95">
                                            <Minus className="h-3 w-3" /> Dùng
                                        </button>
                                        {isAdmin && (
                                            <>
                                                <button onClick={() => openAddModal(item)} className="p-1.5 rounded-lg bg-white/5 text-[#5a7a9a] hover:text-[#c9a227] transition-all">
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg bg-white/5 text-[#5a7a9a] hover:text-red-400 transition-all">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* History View */}
            {activeView === 'history' && (
                <div className="space-y-3">
                    {logs.length === 0 ? (
                        <div className="bg-[#0f1c2e]/60 border border-[#2a4a6f] rounded-3xl p-16 text-center">
                            <History className="h-12 w-12 text-[#2a4a6f] mx-auto mb-4" />
                            <p className="text-[#5a7a9a] font-bold">Chưa có lịch sử</p>
                        </div>
                    ) : logs.map(log => {
                        const ac = ACTION_LABELS[log.action] || ACTION_LABELS.adjust;
                        const Icon = ac.icon;
                        return (
                            <div key={log.id} className="bg-[#0f1c2e]/60 border border-[#2a4a6f] rounded-xl p-4 flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl ${log.action === 'import' ? 'bg-green-500/10' : log.action === 'export' || log.action === 'use' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                                    <Icon className={`h-4 w-4 ${ac.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs font-black ${ac.color}`}>{ac.label}</span>
                                        <span className="text-xs font-bold text-[#f4ece0]">{log.inventory_items?.name || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-[#5a7a9a] font-bold mt-1">
                                        <span>{log.quantity_change > 0 ? '+' : ''}{log.quantity_change} → Còn {log.quantity_after}</span>
                                        {log.users?.full_name && <span>• {log.users.full_name}</span>}
                                        {log.reason && <span>• {log.reason}</span>}
                                    </div>
                                </div>
                                <div className="text-[10px] text-[#5a7a9a] font-bold whitespace-nowrap">
                                    {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-[#0f1c2e] border border-[#c9a227]/20 rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-[#f4ece0]">{editingItem ? '✏️ Sửa sản phẩm' : '📦 Thêm sản phẩm'}</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-xl"><X className="h-5 w-5 text-[#5a7a9a]" /></button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1">Tên sản phẩm *</label>
                                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="VD: Sáp vuốt tóc..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] placeholder:text-[#5a7a9a]/50 focus:border-[#c9a227]/50 outline-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1">Danh mục</label>
                                    <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-[#f4ece0] outline-none">
                                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1">Đơn vị</label>
                                    <select value={formUnit} onChange={e => setFormUnit(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-[#f4ece0] outline-none">
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            {!editingItem && (
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1">Số lượng ban đầu</label>
                                    <input type="number" value={formQuantity} onChange={e => setFormQuantity(Number(e.target.value))} min={0} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] outline-none" />
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1">Mức tối thiểu (cảnh báo)</label>
                                <input type="number" value={formMinQty} onChange={e => setFormMinQty(Number(e.target.value))} min={0} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] outline-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1">Giá nhập (VND)</label>
                                    <input type="number" value={formCost} onChange={e => setFormCost(Number(e.target.value))} min={0} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1">Giá bán (VND)</label>
                                    <input type="number" value={formSell} onChange={e => setFormSell(Number(e.target.value))} min={0} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1">Ghi chú</label>
                                <input value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Nhà cung cấp, lưu ý..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] placeholder:text-[#5a7a9a]/50 outline-none" />
                            </div>
                        </div>

                        <button onClick={handleSaveItem} disabled={saving || !formName.trim()} className="w-full gold-gradient text-[#0a1120] font-black text-base py-4 rounded-2xl hover:shadow-[0_0_30px_rgba(201,162,39,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Package className="h-5 w-5" />}
                            {saving ? 'Đang lưu...' : (editingItem ? 'Cập nhật' : 'Thêm sản phẩm')}
                        </button>
                    </div>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {showStockModal && stockItem && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowStockModal(false)}>
                    <div className="bg-[#0f1c2e] border border-[#c9a227]/20 rounded-3xl w-full max-w-sm p-6 space-y-4 animate-in slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-[#f4ece0]">
                                {ACTION_LABELS[stockAction]?.label || 'Cập nhật'}: {stockItem.name}
                            </h3>
                            <button onClick={() => setShowStockModal(false)} className="p-2 hover:bg-white/5 rounded-xl"><X className="h-5 w-5 text-[#5a7a9a]" /></button>
                        </div>

                        <div className="text-center py-4">
                            <div className="text-4xl font-black text-[#c9a227]">{stockItem.quantity}</div>
                            <div className="text-[10px] uppercase font-bold text-[#5a7a9a] tracking-widest mt-1">Hiện tại ({stockItem.unit})</div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1">
                                {stockAction === 'adjust' ? 'Số lượng mới' : 'Số lượng'}
                            </label>
                            <input type="number" value={stockQty} onChange={e => setStockQty(Number(e.target.value))} min={stockAction === 'adjust' ? 0 : 1} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] outline-none text-center text-xl font-black" />
                            {stockAction !== 'adjust' && (
                                <div className="text-center text-xs text-[#5a7a9a] mt-2">
                                    Sau: <span className="font-bold text-[#f4ece0]">
                                        {(stockAction === 'import' ? stockItem.quantity + stockQty : stockItem.quantity - stockQty)} {stockItem.unit}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-black tracking-widest text-[#5a7a9a] block mb-1">Lý do (tùy chọn)</label>
                            <input value={stockReason} onChange={e => setStockReason(e.target.value)} placeholder="VD: Nhập hàng NCC Phong..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4ece0] placeholder:text-[#5a7a9a]/50 outline-none" />
                        </div>

                        <button onClick={handleStockChange} disabled={saving || stockQty <= 0} className={`w-full font-black text-base py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                            stockAction === 'import' ? 'bg-green-500 text-white' :
                            stockAction === 'export' || stockAction === 'use' ? 'bg-red-500 text-white' :
                            'gold-gradient text-[#0a1120]'
                        }`}>
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUpDown className="h-5 w-5" />}
                            {saving ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
