import { AuthResponse } from './types';

export function persistAuthSession(session: AuthResponse) {
    localStorage.setItem('accessToken', session.accessToken);
    localStorage.setItem('refreshToken', session.refreshToken);
    localStorage.setItem('userProfile', JSON.stringify(session.userProfile));
}
