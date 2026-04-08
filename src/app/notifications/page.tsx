import { AppSidebar } from '@/shared/components/AppSidebar';
import { AppHeader } from '@/shared/components/AppHeader';

export default function NotificationsPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-[#f7f8fa] font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={0} />
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-amber-50 px-6 py-8">
                        <h1 className="text-2xl font-extrabold text-amber-900">Thong bao chua co backend</h1>
                        <p className="mt-3 text-sm leading-6 text-amber-800">
                            Man hinh nay da co route de tranh link hong trong sidebar, nhung repo hien tai chua co service thong bao
                            o folder cha `Medicology`. Muc nay duoc ghi ro trong planning bundle va implementation result de tranh
                            fake API.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
