import { BaseUserLayout } from '@/shared/components/BaseUserLayout';

export default function NotificationsPage() {
    return (
        <BaseUserLayout streak={0}>
            <div className="mx-auto max-w-3xl min-h-full">
                <div className="rounded-3xl border border-amber-200 bg-amber-50 px-8 py-10 shadow-sm">
                    <h1 className="text-3xl font-extrabold text-amber-900 mb-4">Thông báo chưa có backend</h1>
                    <p className="text-base leading-relaxed text-amber-800">
                        Màn hình này đã có route để tránh link hỏng trong sidebar, nhưng repo hiện tại chưa có service thông báo
                        ở folder cha `Medicology`. Mục này được ghi rõ trong planning bundle và implementation result để tránh
                        fake API.
                    </p>
                </div>
            </div>
        </BaseUserLayout>
    );
}
