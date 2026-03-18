import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px]" />

            <div className="z-10 w-full flex justify-center">
                <LoginForm />
            </div>

            <div className="mt-8 z-10">
                <p className="text-zinc-700 text-sm font-medium tracking-tight">
                    ManHub Operations &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
