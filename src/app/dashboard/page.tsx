import dynamic from 'next/dynamic';

const DashboardScreen = dynamic(() => import('@/features/dashboard').then((mod) => mod.DashboardScreen));

export default function DashboardPage() {
    return <DashboardScreen />;
}
