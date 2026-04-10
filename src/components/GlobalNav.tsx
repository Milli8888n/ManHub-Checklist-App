'use client';

import { ClipboardList, LayoutDashboard, Scissors, Settings, Calendar, Target, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GlobalNavProps {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    userRole: string;
}

export default function GlobalNav({ activeTab, onTabChange, userRole }: GlobalNavProps) {
    const router = useRouter();

    const handleTabClick = (tab: string, path?: string) => {
        if (onTabChange) {
            onTabChange(tab);
        }
        if (path) {
            router.push(path);
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f1c2e]/95 backdrop-blur-2xl border-t border-[#c9a227]/20 pb-safe">
            <div className="max-w-7xl mx-auto flex items-center justify-around p-3 overflow-x-auto scrollbar-hide gap-1">
                <button
                    onClick={() => handleTabClick('daily', '/')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'daily' ? 'text-[#c9a227] scale-110' : 'text-[#5a7a9a]'}`}
                >
                    <div className={`p-2 rounded-xl transition-all ${activeTab === 'daily' ? 'bg-[#c9a227]/10' : ''}`}>
                        <ClipboardList className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Checklist</span>
                </button>

                {(userRole === 'admin' || userRole === 'leader') && (
                    <button
                        onClick={() => router.push('/operations')}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'operations' ? 'text-[#c9a227] scale-110' : 'text-[#5a7a9a] hover:text-[#c9a227] hover:scale-110'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${activeTab === 'operations' ? 'bg-[#c9a227]/10' : ''}`}>
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Sảnh / Sơ đồ</span>
                    </button>
                )}

                <button
                    onClick={() => router.push('/barber')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'barber' ? 'text-[#c9a227] scale-110' : 'text-[#5a7a9a] hover:text-[#c9a227] hover:scale-110'}`}
                >
                    <div className={`p-2 rounded-xl transition-all ${activeTab === 'barber' ? 'bg-[#c9a227]/10' : ''}`}>
                        <Scissors className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Ca thợ</span>
                </button>

                <button
                    onClick={() => router.push('/tasks')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'tasks' ? 'text-[#c9a227] scale-110' : 'text-[#5a7a9a] hover:text-[#c9a227] hover:scale-110'}`}
                >
                    <div className={`p-2 rounded-xl transition-all ${activeTab === 'tasks' ? 'bg-[#c9a227]/10' : ''}`}>
                        <Target className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Nhiệm vụ</span>
                </button>
                {(userRole === 'admin' || userRole === 'leader') && (
                    <button
                        onClick={() => router.push('/inventory')}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'inventory' ? 'text-[#c9a227] scale-110' : 'text-[#5a7a9a] hover:text-[#c9a227] hover:scale-110'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-[#c9a227]/10' : ''}`}>
                            <Package className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Tồn kho</span>
                    </button>
                )}

                {(userRole === 'admin' || userRole === 'leader') && (
                    <button
                        onClick={() => handleTabClick('admin', '/')}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'admin' ? 'text-[#c9a227] scale-110' : 'text-[#5a7a9a]'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${activeTab === 'admin' ? 'bg-[#c9a227]/10' : ''}`}>
                            <Settings className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Cài đặt</span>
                    </button>
                )}

                <button
                    onClick={() => handleTabClick('schedule', '/')}
                    className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'schedule' ? 'text-[#c9a227] scale-110' : 'text-[#5a7a9a]'}`}
                >
                    <div className={`p-2 rounded-xl transition-all ${activeTab === 'schedule' ? 'bg-[#c9a227]/10' : ''}`}>
                        <Calendar className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Lịch ca</span>
                </button>
            </div>
        </nav>
    );
}
