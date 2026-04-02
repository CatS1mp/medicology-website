'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { pingStreak } from '@/shared/api/learning';
import { UserDailyStreak } from '@/shared/types/learning';

interface UserProfile {
    email: string;
    fullName: string;
    avatarInitials: string;
}

interface UserContextValue {
    userProfile: UserProfile | null;
    streak: UserDailyStreak | null;
    isLoading: boolean;
    refreshStreak: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [streak, setStreak] = useState<UserDailyStreak | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadUserData = async () => {
        setIsLoading(true);
        try {
            // Load user profile from localStorage
            const profileStr = localStorage.getItem('userProfile');
            if (profileStr) {
                const profile = JSON.parse(profileStr);
                const initials = profile.fullName
                    ? profile.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    : profile.email[0].toUpperCase();
                
                setUserProfile({
                    email: profile.email,
                    fullName: profile.fullName || profile.email,
                    avatarInitials: initials,
                });
            }

            // Load streak from API
            const streakData = await pingStreak();
            setStreak(streakData);
        } catch (error) {
            console.error('Error loading user data:', error);
            setStreak(null);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshStreak = async () => {
        try {
            const streakData = await pingStreak();
            setStreak(streakData);
        } catch (error) {
            console.error('Error refreshing streak:', error);
        }
    };

    useEffect(() => {
        loadUserData();
    }, []);

    return (
        <UserContext.Provider value={{ userProfile, streak, isLoading, refreshStreak }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
