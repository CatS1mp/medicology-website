import { AdminAuthGate } from '@/features/admin';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <AdminAuthGate>{children}</AdminAuthGate>;
}
