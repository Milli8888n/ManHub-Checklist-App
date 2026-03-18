'use client';

import { BarChart3, CheckSquare, Clock, AlertCircle } from 'lucide-react';

interface AdminStatsProps {
    totalTasks: number;
    completedTasks: number;
    photoTasks: number;
    photoCompleted: number;
}

export default function AdminStats({
    totalTasks,
    completedTasks,
    photoTasks,
    photoCompleted
}: AdminStatsProps) {
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {/* Overall Completion */}
            <div className="bg-[#0f1c2e]/60 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-[#c9a227]/20 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BarChart3 className="h-8 md:h-12 w-8 md:w-12" />
                </div>
                <p className="text-[#8a9bb0] text-[9px] md:text-[10px] uppercase font-black tracking-widest mb-1">Tiến độ</p>
                <div className="flex items-end gap-1">
                    <span className="text-2xl md:text-4xl font-black text-[#f4ece0]">{completionRate}%</span>
                </div>
                <div className="mt-3 md:mt-4 h-1 bg-[#1e3a5f] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#c9a227] rounded-full transition-all duration-1000"
                        style={{ width: `${completionRate}%` }}
                    />
                </div>
            </div>

            {/* Numerical Progress */}
            <div className="bg-[#0f1c2e]/60 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-[#c9a227]/20 shadow-xl group text-left">
                <p className="text-[#8a9bb0] text-[9px] md:text-[10px] uppercase font-black tracking-widest mb-1">Hoàn thành</p>
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-green-500/10 rounded-lg md:rounded-xl">
                        <CheckSquare className="h-5 md:h-6 w-5 md:w-6 text-green-500" />
                    </div>
                    <div className="flex items-end gap-1">
                        <span className="text-2xl md:text-3xl font-black text-[#f4ece0]">{completedTasks}</span>
                        <span className="text-[#5a7a9a] font-bold mb-0.5 text-[10px] md:text-xs">/{totalTasks}</span>
                    </div>
                </div>
            </div>

            {/* Photo Verification */}
            <div className="bg-[#0f1c2e]/60 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-[#c9a227]/20 shadow-xl group text-left">
                <p className="text-[#8a9bb0] text-[9px] md:text-[10px] uppercase font-black tracking-widest mb-1">Xác minh</p>
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-amber-500/10 rounded-lg md:rounded-xl">
                        <AlertCircle className="h-5 md:h-6 w-5 md:w-6 text-amber-500" />
                    </div>
                    <div className="flex items-end gap-1">
                        <span className="text-2xl md:text-3xl font-black text-[#f4ece0]">{photoCompleted}</span>
                        <span className="text-[#5a7a9a] font-bold mb-0.5 text-[10px] md:text-xs">/{photoTasks}</span>
                    </div>
                </div>
            </div>

            {/* Time Context */}
            <div className="bg-[#0f1c2e]/60 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-[#c9a227]/20 shadow-xl group text-left">
                <p className="text-[#8a9bb0] text-[9px] md:text-[10px] uppercase font-black tracking-widest mb-1">Cập nhật</p>
                <div className="flex items-center gap-2 md:gap-3 text-[#f4ece0]">
                    <div className="p-1.5 md:p-2 bg-[#1e3a5f] rounded-lg md:rounded-xl">
                        <Clock className="h-5 md:h-6 w-5 md:w-6 text-[#8a9bb0]" />
                    </div>
                    <span className="text-base md:text-xl font-bold tracking-tight">Hôm nay</span>
                </div>
            </div>
        </div>
    );
}
