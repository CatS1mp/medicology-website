'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy_client_id_for_build';

    if (clientId === 'dummy_client_id_for_build') {
        console.warn('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable. Using a dummy fallback for the build.');
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
