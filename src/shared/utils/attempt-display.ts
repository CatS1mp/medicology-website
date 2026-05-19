import type { AttemptDisplayOutcome } from '@/shared/types/assessment';

const MASCOT_BY_KEY: Record<string, string> = {
    'mascot-15': '/images/Mascot/15.svg',
    'mascot-22': '/images/Mascot/22.svg',
    'mascot-23': '/images/Mascot/23.svg',
    'mascot-21': '/images/Mascot/21.svg',
};

export function resolveMascotSrc(mascotKey: string | null | undefined, scorePercent: number | null | undefined): string | null {
    if (mascotKey && MASCOT_BY_KEY[mascotKey]) {
        return MASCOT_BY_KEY[mascotKey];
    }
    if (scorePercent == null) return null;
    if (scorePercent >= 100) return MASCOT_BY_KEY['mascot-15'];
    if (scorePercent >= 75) return MASCOT_BY_KEY['mascot-22'];
    if (scorePercent >= 25) return MASCOT_BY_KEY['mascot-23'];
    return MASCOT_BY_KEY['mascot-21'];
}

export type LessonCompleteOutcome = 'loading' | 'page-error' | 'result-error' | 'grading' | 'passed' | 'failed' | 'neutral';

export function mapDisplayOutcomeToUi(outcome: AttemptDisplayOutcome | null | undefined): LessonCompleteOutcome {
    switch (outcome) {
        case 'PASSED':
            return 'passed';
        case 'FAILED':
            return 'failed';
        case 'GRADING':
            return 'grading';
        case 'NEUTRAL':
            return 'neutral';
        default:
            return 'neutral';
    }
}
