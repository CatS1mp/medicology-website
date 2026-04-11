import React from 'react';

interface LessonStepProgressProps {
    currentStep: number;
    totalSteps: number;
}

export function LessonStepProgress({ currentStep, totalSteps }: LessonStepProgressProps) {
    const safeTotal = Math.max(totalSteps, 1);
    const safeCurrent = Math.min(Math.max(currentStep, 1), safeTotal);
    const percentage = (safeCurrent / safeTotal) * 100;

    return (
        <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2aa4e8]">Progress</p>
                <p className="text-sm font-semibold text-gray-600">
                    {safeCurrent}/{safeTotal}
                </p>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                    className="h-full rounded-full bg-[#2aa4e8] transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
