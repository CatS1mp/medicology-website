'use client';

import React from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useLogout } from '@/shared/hooks/useLogout';
import { useLearningStreak } from '@/shared/hooks/useLearningStreak';
import styles from './user-layout.module.css';

interface BaseUserLayoutProps {
    children: React.ReactNode;
    /** Optional custom streak value if the component knows better */
    streak?: number;
    /** Optional padding override for the floating container */
    padding?: string | number;
    /** Hide the floating container background (useful for landing-style pages) */
    noContainer?: boolean;
}

/**
 * BaseUserLayout provides the standard "Floating Content" structure for all user screens.
 * Includes Sidebar, Header, and a signature elevated container for core content.
 */
export const BaseUserLayout: React.FC<BaseUserLayoutProps> = ({ 
    children, 
    streak, 
    padding,
    noContainer = false 
}) => {
    const { handleLogout } = useLogout();
    const { streakDays } = useLearningStreak();
    
    const effectiveStreak = streak !== undefined ? streak : (streakDays ?? 0);

    return (
        <div className={styles.container}>
            <AppSidebar />
            
            <main className={styles.mainLayout}>
                <AppHeader streak={effectiveStreak} onLogout={handleLogout} />
                
                <div className={styles.contentContainer}>
                    {noContainer ? (
                        <div className="flex-1 w-full">
                            {children}
                        </div>
                    ) : (
                        <div 
                            className={styles.floatingContent}
                            style={padding !== undefined ? { padding } : undefined}
                        >
                            {children}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
