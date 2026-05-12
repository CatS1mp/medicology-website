import dynamic from 'next/dynamic';

const MyCoursesScreen = dynamic(() => import('@/features/courses').then((mod) => mod.MyCoursesScreen));

export default function CoursesIndexPage() {
    return <MyCoursesScreen />;
}
