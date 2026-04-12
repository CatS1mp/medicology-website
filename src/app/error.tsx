'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center">
            <h1 className="text-xl font-semibold text-gray-900">Đã xảy ra lỗi</h1>
            <p className="max-w-md text-sm text-gray-600">
                Trang không thể hiển thị đúng. Bạn có thể thử tải lại.
            </p>
            <button
                type="button"
                onClick={() => reset()}
                className="rounded-xl bg-[#1CA1F2] px-5 py-2 text-sm font-semibold text-white"
            >
                Thử lại
            </button>
        </div>
    );
}
