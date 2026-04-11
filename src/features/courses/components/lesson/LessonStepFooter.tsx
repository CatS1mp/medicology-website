import React from 'react';
import { Button } from '@/shared/components/Button';

interface LessonStepFooterProps {
    canGoBack: boolean;
    canContinue: boolean;
    continueLabel: string;
    submitting: boolean;
    onBack: () => void;
    onContinue: () => void;
}

export function LessonStepFooter({
    canGoBack,
    canContinue,
    continueLabel,
    submitting,
    onBack,
    onContinue,
}: LessonStepFooterProps) {
    return (
        <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" disabled={!canGoBack || submitting} onClick={onBack}>
                Quay lại
            </Button>
            <Button disabled={!canContinue || submitting} onClick={onContinue}>
                {submitting ? 'Đang xử lý...' : continueLabel}
            </Button>
        </div>
    );
}
