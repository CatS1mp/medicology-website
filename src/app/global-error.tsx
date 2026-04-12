'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
        <html lang="vi">
            <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center antialiased">
                <h1 className="text-xl font-semibold text-gray-900">Đã xảy ra lỗi nghiêm trọng</h1>
                <p className="max-w-md text-sm text-gray-600">Vui lòng tải lại ứng dụng.</p>
                <button
                    type="button"
                    onClick={() => reset()}
                    className="rounded-xl bg-[#1CA1F2] px-5 py-2 text-sm font-semibold text-white"
                >
                    Thử lại
                </button>
            </body>
        </html>
    );
}
