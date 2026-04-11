import React from 'react';

interface LessonStepBreadcrumbProps {
    courseName: string;
    sectionName: string;
    lessonName: string;
}

export function LessonStepBreadcrumb({ courseName, sectionName, lessonName }: LessonStepBreadcrumbProps) {
    return (
        <div className="mb-5 flex items-center gap-2 text-sm text-gray-400">
            <span>{courseName}</span>
            <span>›</span>
            <span>{sectionName}</span>
            <span>›</span>
            <span className="font-semibold text-gray-700">{lessonName}</span>
        </div>
    );
}
