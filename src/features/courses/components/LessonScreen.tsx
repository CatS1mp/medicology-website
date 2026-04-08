'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/shared/components/AppHeader';
import { AppSidebar } from '@/shared/components/AppSidebar';
import { Button } from '@/shared/components/Button';
import { useLogout } from '@/shared/hooks/useLogout';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import { completeLesson, getCourses } from '@/shared/api/learning';

export function LessonScreen({ courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string }) {
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [lesson, setLesson] = useState<null | {
        id: string;
        courseName: string;
        sectionName: string;
        name: string;
        description: string | null;
        difficulty: string | null;
        estimatedDurationMinutes: number | null;
        content: string | null;
    }>(null);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            try {
                const courses = await getCourses();
                const course = courses.find((item) => item.slug === courseSlug);
                const match = course?.sections?.flatMap((section) =>
                    (section.lessons ?? []).map((lessonItem) => ({
                        id: lessonItem.id,
                        courseName: course.name,
                        sectionName: section.name,
                        name: lessonItem.name,
                        description: lessonItem.description,
                        difficulty: lessonItem.difficultyLevel,
                        estimatedDurationMinutes: lessonItem.estimatedDurationMinutes,
                        content: lessonItem.content,
                        slug: lessonItem.slug,
                    }))
                ).find((item) => item.slug === lessonSlug);
                if (!cancelled) setLesson(match ?? null);
            } catch (error) {
                if (!cancelled) setMessage(error instanceof Error ? error.message : 'Khong the tai bai hoc.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        run();
        return () => { cancelled = true; };
    }, [courseSlug, lessonSlug]);

    async function handleComplete() {
        if (!lesson) return;
        setMessage('');
        try {
            await completeLesson(lesson.id);
            setMessage('Da danh dau bai hoc hoan thanh.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Khong the danh dau bai hoc.');
        }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-white font-sans">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AppHeader streak={streakDays ?? 0} onLogout={handleLogout} />
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="mx-auto max-w-4xl">
                        <Link href={`/courses/${courseSlug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200">‹</span>
                            Quay lai lo trinh
                        </Link>

                        {loading ? <div className="py-20 text-center text-gray-500">Dang tai bai hoc...</div> : !lesson ? (
                            <div className="rounded-3xl border border-gray-200 bg-gray-50 px-6 py-12 text-center text-gray-500">Khong tim thay bai hoc.</div>
                        ) : (
                            <div className="space-y-6">
                                <div className="rounded-3xl border border-gray-200 bg-[#f8fbff] px-6 py-6">
                                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2aa4e8]">{lesson.courseName} • {lesson.sectionName}</p>
                                    <h1 className="mt-3 text-3xl font-extrabold text-gray-900">{lesson.name}</h1>
                                    <p className="mt-3 max-w-3xl text-sm text-gray-600">{lesson.description || 'Bai hoc nay dang su dung noi dung tu learning service.'}</p>
                                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                                        {lesson.difficulty && <span className="rounded-full bg-white px-3 py-1">{lesson.difficulty}</span>}
                                        {lesson.estimatedDurationMinutes && <span className="rounded-full bg-white px-3 py-1">{lesson.estimatedDurationMinutes} phut</span>}
                                    </div>
                                </div>

                                {!!message && <div className="rounded-2xl border border-[#bfe6fb] bg-[#f3fbff] px-4 py-3 text-sm text-[#126b98]">{message}</div>}

                                <article className="rounded-3xl border border-gray-200 px-6 py-6">
                                    <div className="prose max-w-none whitespace-pre-wrap text-sm leading-7 text-gray-700">
                                        {lesson.content || 'Noi dung bai hoc hien chua co trong service.'}
                                    </div>
                                </article>

                                <div className="flex justify-end">
                                    <Button onClick={handleComplete}>Danh dau hoan thanh</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
