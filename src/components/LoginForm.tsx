'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginForm() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Auto-append domain if it's just a username/ID
        const loginEmail = identifier.includes('@') ? identifier : `${identifier.trim().toLowerCase()}@manhub.com`;

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password,
            });

            if (authError) throw authError;

            if (data.user) {
                window.location.href = '/';
            }
        } catch (err: any) {
            setError(err.message === 'Invalid login credentials' ? 'Mã nhân viên hoặc mật khẩu không đúng' : (err.message || 'Đã có lỗi xảy ra khi đăng nhập'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-[#1A2B56]/80 p-8 rounded-[2.5rem] border border-[#c9a227]/20 backdrop-blur-md shadow-2xl">
            <div className="flex flex-col mb-8 text-center">
                <div className="mx-auto mb-4">
                    <Image
                        src="/manhub_logo.png"
                        alt="ManHub Logo"
                        width={180}
                        height={120}
                        className="object-contain"
                        priority
                    />
                </div>
                <h2 className="text-xl font-bold text-[#f4ece0] tracking-tight">Chào mừng trở lại</h2>
                <p className="text-[#8a9bb0] text-sm mt-1">Hệ thống quản lý Checklist</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8a9bb0] uppercase tracking-wider ml-1" htmlFor="identifier">
                        Mã nhân viên / Username
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-[#5a7a9a] group-focus-within:text-[#c9a227] transition-colors" />
                        </div>
                        <input
                            id="identifier"
                            type="text"
                            required
                            placeholder="Ví dụ: LTN001 hoặc admin"
                            className="w-full bg-[#0f1c2e] border border-[#2a4a6f] text-[#f4ece0] pl-11 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] transition-all placeholder:text-[#4a6a8a]"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8a9bb0] uppercase tracking-wider ml-1" htmlFor="password">
                        Mật khẩu
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-[#5a7a9a] group-focus-within:text-[#c9a227] transition-colors" />
                        </div>
                        <input
                            id="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full bg-[#0f1c2e] border border-[#2a4a6f] text-[#f4ece0] pl-11 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c9a227]/30 focus:border-[#c9a227] transition-all placeholder:text-[#4a6a8a]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-red-900/20 text-red-400 p-3.5 rounded-2xl border border-red-900/30 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#c9a227] hover:bg-[#d4b94a] disabled:bg-[#1e3a5f] disabled:text-[#5a7a9a] text-[#0f1c2e] font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-[#c9a227]/20 transition-all flex items-center justify-center gap-2 mt-4 text-base active:scale-[0.98]"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            Truy cập hệ thống
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-[#5a7a9a] text-xs">
                    Liên hệ quản trị viên nếu bạn quên mật khẩu
                </p>
            </div>
        </div>
    );
}
