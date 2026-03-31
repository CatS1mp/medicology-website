'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
        // Fallback or warning if clientId is missing in dev
        console.warn('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable');
        return <>{children}</>;
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
