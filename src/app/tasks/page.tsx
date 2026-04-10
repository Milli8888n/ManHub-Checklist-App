'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AppHeader from '@/components/AppHeader';
import GlobalNav from '@/components/GlobalNav';
import BarberTaskBoard from '@/components/BarberTaskBoard';

export default function TasksPage() {
    const [userRole, setUserRole] = useState('staff');
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data: profile } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (profile) setUserRole(profile.role || 'staff');
            }
            setLoading(false);
        };
        init();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a1120] text-[#f4ece0]">
                <div className="animate-pulse text-[#c9a227] text-xl font-bold">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a1120] text-[#f4ece0] font-sans pb-24">
            <AppHeader />
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                <BarberTaskBoard userRole={userRole} currentUserId={userId} />
            </main>
            <GlobalNav activeTab="tasks" onTabChange={() => {}} userRole={userRole} />
        </div>
    );
}
