'use client';
// Version: 1.1.0 - Auto-Notification Fix

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, LogOut, Bell, BellOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AppHeader() {
    const [userName, setUserName] = useState<string>('');
    const [userRole, setUserRole] = useState<string>('staff');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('role, full_name')
                    .eq('id', user.id)
                    .single();
                if (profile) {
                    setUserName(profile.full_name || '');
                    setUserRole(profile.role || 'staff');
                }
            }

            // Check push subscription
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const sub = await registration.pushManager.getSubscription();
                    setIsSubscribed(!!sub);
                } catch {
                    // ignore
                }
            }
        };
        init();
    }, []);

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('Trình duyệt của bạn không hỗ trợ thông báo!');
            return;
        }

        try {
            const status = await Notification.requestPermission();
            if (status !== 'granted') {
                alert('Bạn cần cấp quyền thông báo để tính năng này hoạt động!');
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            
            // Unsubscribe existing to be safe and refresh everything
            const existingSub = await registration.pushManager.getSubscription();
            if (existingSub) {
                await existingSub.unsubscribe();
            }

            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                console.error('VAPID Key missing in env');
                return;
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey.trim())
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Remove all old versions for this browser to avoid duplicates
                await supabase.from('push_subscriptions')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('user_agent', navigator.userAgent);

                // Add the new fresh one
                await supabase.from('push_subscriptions').insert({
                    user_id: user.id,
                    subscription: sub,
                    user_agent: navigator.userAgent
                });
            }

            setIsSubscribed(true);
            alert('Đã bật thông báo thành công! Bạn sẽ nhận được thông báo thử nghiệm ngay bây giờ.');
            
            // Trigger a quick test notification for just this user
            if (user) {
                fetch('/api/notifications/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userIds: [user.id],
                        title: '🔔 Đã kết nối!',
                        body: 'Hệ thống thông báo ManHub đã sẵn sàng trên thiết bị này.'
                    })
                });
            }
        } catch (error: any) {
            console.error('Push Subscription Error:', error);
            alert('Lỗi: ' + error.message);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-50 bg-[#1A2B56]/80 backdrop-blur-xl border-b border-[#c9a227]/20 px-4 md:px-8 py-4 transition-all duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                    <Image src="/manhub_logo.png" alt="ManHub" width={100} height={40} className="object-contain h-8 w-auto" priority />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={subscribeToPush}
                        className={`p-2 rounded-full transition-colors ${isSubscribed ? 'bg-[#c9a227]/20 text-[#c9a227]' : 'bg-[#1e3a5f] text-[#5a7a9a] hover:text-[#f4ece0]'}`}
                        title={isSubscribed ? 'Đã bật thông báo' : 'Bật thông báo'}
                    >
                        {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                    </button>
                    <div className="flex items-center gap-2 pr-1">
                        <div className="h-9 w-9 bg-gradient-to-br from-[#2a4a6f] to-[#1e3a5f] rounded-full flex items-center justify-center border border-[#c9a227]/30 shadow-inner">
                            <User className="h-5 w-5 text-[#c9a227]" />
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                            <span className="text-xs font-bold capitalize truncate max-w-[100px] text-[#f4ece0]">{userName || 'User'}</span>
                            <span className="text-[9px] text-[#8a9bb0] uppercase tracking-widest font-bold">{userRole}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="p-2 bg-[#0f1c2e]/50 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all border border-[#2a4a6f]/50 group active:scale-90"
                        title="Đăng xuất"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
