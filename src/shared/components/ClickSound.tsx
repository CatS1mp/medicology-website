'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { hasRefreshSession } from '@/features/auth/session';

export function ClickSound() {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    React.useEffect(() => {
        function syncAuthState() {
            setIsAuthenticated(hasRefreshSession());
        }

        syncAuthState();
        window.addEventListener('auth-session-updated', syncAuthState);
        window.addEventListener('user-profile-updated', syncAuthState);
        window.addEventListener('storage', syncAuthState);

        return () => {
            window.removeEventListener('auth-session-updated', syncAuthState);
            window.removeEventListener('user-profile-updated', syncAuthState);
            window.removeEventListener('storage', syncAuthState);
        };
    }, []);

    React.useEffect(() => {
        if (!isAuthenticated || pathname?.startsWith('/admin')) {
            return;
        }

        const audio = new Audio('/audio/click-sound.mp3');
        audio.preload = 'auto';
        audio.volume = 0.35;
        audioRef.current = audio;

        function playClickSound(target: EventTarget | null) {
            if (!(target instanceof Element)) return;
            if (target.closest('[data-click-sound="off"]')) return;

            const nextAudio = audioRef.current;
            if (!nextAudio) return;

            nextAudio.currentTime = 0;
            void nextAudio.play().catch(() => undefined);
        }

        function handlePointerDown(event: PointerEvent) {
            if (event.defaultPrevented) return;
            if (event.button !== 0) return;
            playClickSound(event.target);
        }

        document.addEventListener('pointerdown', handlePointerDown, true);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown, true);
            audio.pause();
            audioRef.current = null;
        };
    }, [isAuthenticated, pathname]);

    return null;
}
