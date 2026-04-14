'use client';

import { useRef } from 'react';
import { Circle, CheckCircle2, Camera, Loader2, Image as ImageIcon, Clock, XCircle, Check, X } from 'lucide-react';

interface TaskCardProps {
    id: string;
    title: string;
    description: string;
    area: string;
    status: 'pending' | 'submitted' | 'completed' | 'rejected';
    isPhotoRequired: boolean;
    imageUrl?: string | null;
    frequency?: string;
    duration?: string;
    userRole: string;
    currentUserId?: string | null;
    performedBy?: string | null;
    onSubmit?: (id: string, photoUrl: string) => Promise<void>;
    onApprove?: (id: string) => Promise<void>;
    onReject?: (id: string, reason?: string) => Promise<void>;
    onUpload?: (file: File) => Promise<string>;
    isUpdating?: boolean;
    submittedBy?: string;
    department?: string;
}

export default function TaskCard({
    id,
    title,
    description,
    status,
    isPhotoRequired,
    imageUrl,
    frequency,
    duration,
    userRole,
    onSubmit,
    onApprove,
    onUpload,
    isUpdating = false,
    submittedBy,
    department,
    currentUserId,
    performedBy,
    onReject
}: TaskCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isCompleted = status === 'completed';
    const isSubmitted = status === 'submitted';
    const isRejected = status === 'rejected';
    const isPending = status === 'pending';

    // Status badge config
    const statusConfig = {
        pending: { label: 'Chưa làm', color: 'text-[#5a7a9a]', bg: 'bg-[#1e3a5f]/50', border: 'border-[#2a4a6f]' },
        submitted: { label: 'Chờ duyệt', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
        completed: { label: 'Đã duyệt', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
        rejected: { label: 'Bị từ chối', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' }
    };

    const currentStatus = statusConfig[status];

    // Staff/Leader: Click to handle task (upload photo or mark as done)
    const handleClick = async () => {
        if (isUpdating) return;
        
        // Only staff or leaders can perform tasks
        const canPerform = userRole === 'staff' || userRole === 'leader';
        if (!canPerform) return;
        
        if (isCompleted || isSubmitted) return;

        // Condition 1: Photo is required
        if (isPhotoRequired) {
            if (onUpload) {
                fileInputRef.current?.click();
            }
        } 
        // Condition 2: No photo required, ask for confirmation before submitting
        else if (onSubmit) {
            if (window.confirm('Nhiệm vụ này không yêu cầu ảnh. Xác nhận hoàn thành?')) {
                await onSubmit(id, ''); // Submit with empty photo URL
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onUpload || !onSubmit) return;

        try {
            const url = await onUpload(file);
            await onSubmit(id, url);
        } catch (err) {
            console.error('Photo upload failed');
        }

        e.target.value = '';
    };

    // Admin: Approve task
    const handleApprove = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isUpdating || !onApprove) return;
        await onApprove(id);
    };

    // Admin: Reject task
    const handleReject = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isUpdating || !onReject) return;
        const reason = prompt('Lý do từ chối (tùy chọn):');
        await onReject(id, reason || undefined);
    };

    return (
        <div
            onClick={(userRole === 'staff' || userRole === 'leader') ? handleClick : undefined}
            className={`group p-4 md:p-5 rounded-2xl md:rounded-3xl border transition-all relative overflow-hidden ${(userRole === 'staff' || userRole === 'leader') && (isPending || isRejected) ? 'cursor-pointer active:scale-[0.98]' : ''
                } ${isCompleted
                    ? 'bg-green-500/10 border-green-500/30'
                    : isSubmitted
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : isRejected
                            ? 'bg-red-500/5 border-red-500/20'
                            : 'bg-[#0f1c2e]/60 border-[#2a4a6f] hover:border-[#c9a227]/50'
                }`}
        >
            <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                data-testid={`file-input-${id}`}
            />

            {/* Status Badge */}
            <div className="absolute top-0 right-0 p-3">
                {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#5a7a9a]" />
                ) : (
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${currentStatus.bg} ${currentStatus.border} border`}>
                        {isPending && (
                            isPhotoRequired 
                                ? <Camera className="h-3 w-3 text-[#c9a227]" /> 
                                : <CheckCircle2 className="h-3 w-3 text-[#5a7a9a]" />
                        )}
                        {isSubmitted && <Clock className="h-3 w-3 text-amber-400" />}
                        {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-400" />}
                        {isRejected && <XCircle className="h-3 w-3 text-red-400" />}
                        <span className={`text-[9px] uppercase font-black ${currentStatus.color}`}>{currentStatus.label}</span>
                    </div>
                )}
            </div>

            <div className="flex items-start gap-4">
                <div className="mt-0.5">
                    {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : isSubmitted ? (
                        <Clock className="h-6 w-6 text-amber-400" />
                    ) : isRejected ? (
                        <XCircle className="h-6 w-6 text-red-400" />
                    ) : (
                        <Circle className="h-6 w-6 text-[#2a4a6f]" />
                    )}
                </div>
                <div className="flex-1 min-w-0 pr-16">
                    <h4 className={`font-bold mb-1 leading-tight transition-colors text-sm md:text-base ${isCompleted ? 'text-green-400' : isSubmitted ? 'text-amber-300' : isRejected ? 'text-red-300' : 'text-[#f4ece0]'
                        }`}>
                        {title}
                    </h4>
                    <p className={`text-sm line-clamp-2 leading-relaxed transition-colors mb-3 ${isCompleted ? 'text-[#8a9bb0]/60' : 'text-[#8a9bb0]'
                        }`}>
                        {description}
                    </p>

                    {(submittedBy || duration) && (
                        <div className="flex items-center gap-2 mb-2">
                            {submittedBy && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 font-bold flex items-center gap-1">
                                    <span className="opacity-70 font-medium">Nộp bởi:</span> {submittedBy}
                                </span>
                            )}
                            {duration && (
                                <span className="text-[10px] text-[#5a7a9a] font-medium">
                                    ⏱️ {duration}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Photo Preview for Submitted/Completed */}
                    {imageUrl && (isSubmitted || isCompleted || isRejected) && (
                        <div className="mb-3">
                            <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-[#c9a227] hover:text-[#d4b94a] transition-colors">
                                <ImageIcon className="h-4 w-4" />
                                Xem ảnh đã chụp
                            </a>
                        </div>
                    )}

                    {/* Admin/Leader: Approve/Reject Buttons */}
                    {(userRole === 'admin' || (userRole === 'leader' && performedBy !== currentUserId)) && isSubmitted && (
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleApprove}
                                disabled={isUpdating}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                                data-testid={`btn-approve-${id}`}
                            >
                                <Check className="h-4 w-4" />
                                Duyệt
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={isUpdating}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                                data-testid={`btn-reject-${id}`}
                            >
                                <X className="h-4 w-4" />
                                Từ chối
                            </button>
                        </div>
                    )}

                    {/* Staff/Leader: Hint for rejected tasks */}
                    {(userRole === 'staff' || userRole === 'leader') && isRejected && performedBy === currentUserId && (
                        <p className="text-xs text-red-400 mt-2 font-medium">
                            ⚠️ Báo cáo bị từ chối. Bấm vào đây để chụp lại.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
