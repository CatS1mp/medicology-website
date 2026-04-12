const RESEND_COOLDOWN_MS = 60_000;

function key(email: string) {
    return `resendCooldown:${email.toLowerCase().trim()}`;
}

export function canResendVerification(email: string): boolean {
    if (typeof window === 'undefined') return true;
    const last = Number(localStorage.getItem(key(email)) ?? 0);
    return Date.now() - last > RESEND_COOLDOWN_MS;
}

export function markResendVerification(email: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key(email), String(Date.now()));
}

export function resendCooldownRemainingMs(email: string): number {
    if (typeof window === 'undefined') return 0;
    const last = Number(localStorage.getItem(key(email)) ?? 0);
    const elapsed = Date.now() - last;
    return Math.max(0, RESEND_COOLDOWN_MS - elapsed);
}
