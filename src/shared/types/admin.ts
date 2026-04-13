export type StudentStatusUi = 'Hoạt động' | 'Chưa xác thực' | 'Đã khóa';

/** Raw admin user record — tolerate multiple backend field names */
export interface AdminUserApiRecord {
    id: string;
    email?: string | null;
    fullName?: string | null;
    displayName?: string | null;
    studentCode?: string | null;
    studentId?: string | null;
    targetAudience?: string | null;
    audience?: string | null;
    verified?: boolean | null;
    emailVerified?: boolean | null;
    locked?: boolean | null;
    disabled?: boolean | null;
    accountStatus?: string | null;
    status?: string | null;
    createdAt?: string | null;
    joinedAt?: string | null;
    streakDays?: number | null;
    learningStreak?: number | null;
    /** Optional profile fields when API provides them */
    phone?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
    bio?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
    lastLoginAt?: string | null;
    longestStreakDays?: number | null;
}

export interface AdminUserListResult {
    items: AdminUserApiRecord[];
    total: number;
}

export function normalizeSpringListPayload<T>(data: unknown): { items: T[]; total: number } {
    if (Array.isArray(data)) {
        return { items: data, total: data.length };
    }
    if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;
        if (Array.isArray(d.content)) {
            const items = d.content as T[];
            const total = typeof d.totalElements === 'number' ? d.totalElements : items.length;
            return { items, total };
        }
        if (Array.isArray(d.items)) {
            const items = d.items as T[];
            const total = typeof d.total === 'number' ? d.total : items.length;
            return { items, total };
        }
    }
    return { items: [], total: 0 };
}

function parseAudienceLabel(raw: AdminUserApiRecord): string {
    const v = raw.targetAudience ?? raw.audience ?? '';
    if (!v) return '—';
    const u = v.toUpperCase();
    if (u.includes('CHILD') || u.includes('TRE')) return 'Trẻ em';
    if (u.includes('TEEN') || u.includes('VỊ')) return 'Vị thành niên';
    if (u.includes('ADULT') || u.includes('NGƯỜI')) return 'Người lớn';
    return v;
}

function formatDateVi(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('vi-VN');
}

export function mapAdminUserStatus(raw: AdminUserApiRecord): StudentStatusUi {
    const s = (raw.accountStatus ?? raw.status ?? '').toUpperCase();
    if (raw.locked === true || raw.disabled === true || s.includes('LOCK') || s.includes('BAN')) {
        return 'Đã khóa';
    }
    if (raw.verified === false || raw.emailVerified === false || s.includes('PENDING') || s.includes('UNVER')) {
        return 'Chưa xác thực';
    }
    return 'Hoạt động';
}

export interface StudentTableRow {
    id: string;
    code: string;
    fullName: string;
    email: string;
    audience: string;
    joinedAt: string;
    streak: number;
    status: StudentStatusUi;
}

export function mapAdminUserToStudentRow(raw: AdminUserApiRecord): StudentTableRow {
    const name = raw.fullName?.trim() || raw.displayName?.trim() || raw.email || '—';
    const code =
        raw.studentCode?.trim() ||
        raw.studentId?.trim() ||
        (raw.id.length > 8 ? raw.id.slice(0, 8) : raw.id);
    return {
        id: raw.id,
        code,
        fullName: name,
        email: raw.email ?? '—',
        audience: parseAudienceLabel(raw),
        joinedAt: formatDateVi(raw.joinedAt ?? raw.createdAt),
        streak: raw.streakDays ?? raw.learningStreak ?? 0,
        status: mapAdminUserStatus(raw),
    };
}

export type AdminUserStatusPatch = 'ACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';

/** Auth-service `UserResponseDTO` (GET /api/v1/admin/users list). */
export interface AuthUserResponseDTO {
    id: string;
    email: string;
    username: string;
    active: boolean;
    verified: boolean;
    admin?: boolean;
    lastLoginAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

/** Auth-service `GET /api/v1/admin/users/{id}` body. */
export interface AuthAdminUserDetailResponse {
    user: AuthUserResponseDTO;
    profile: {
        userId: string;
        email: string;
        username: string;
        lastName: string | null;
        firstName: string | null;
        dateOfBirth: string | null;
        gender: string | null;
        address: string | null;
        displayName: string | null;
        bio: string | null;
    } | null;
    settings?: unknown;
    linkedAccounts?: unknown;
    sessions?: unknown;
}

export function mapAuthUserResponseToRecord(u: AuthUserResponseDTO): AdminUserApiRecord {
    return {
        id: String(u.id),
        email: u.email,
        username: u.username,
        fullName: u.username || u.email,
        verified: u.verified,
        emailVerified: u.verified,
        locked: u.active === false,
        disabled: u.active === false,
        createdAt: u.createdAt ?? null,
        joinedAt: u.createdAt ?? null,
        lastLoginAt: u.lastLoginAt ?? null,
    };
}

/** Split "Họ và tên" into họ + tên for `UpdateProfileRequestDTO` (auth-service). */
export function splitVietnameseFullName(fullName: string): { lastName: string | null; firstName: string | null } {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { lastName: null, firstName: null };
    if (parts.length === 1) return { lastName: parts[0], firstName: null };
    return { lastName: parts.slice(0, -1).join(' '), firstName: parts[parts.length - 1] ?? null };
}

export function mapAuthAdminUserDetailToRecord(d: AuthAdminUserDetailResponse): AdminUserApiRecord {
    const u = d.user;
    const p = d.profile;
    const composed =
        p && (p.lastName?.trim() || p.firstName?.trim())
            ? [p.lastName?.trim(), p.firstName?.trim()].filter(Boolean).join(' ')
            : '';
    const display = p?.displayName?.trim() ?? '';
    const name = (display || composed || u.email || '—').trim();

    return {
        id: String(u.id),
        email: u.email,
        username: p?.username ?? u.username,
        fullName: name,
        displayName: p?.displayName ?? null,
        verified: u.verified,
        emailVerified: u.verified,
        locked: u.active === false,
        disabled: u.active === false,
        createdAt: u.createdAt ?? null,
        joinedAt: u.createdAt ?? null,
        lastLoginAt: u.lastLoginAt ?? null,
        gender: p?.gender ?? null,
        dateOfBirth: p?.dateOfBirth ? String(p.dateOfBirth) : null,
        address: p?.address ?? null,
        bio: p?.bio ?? null,
    };
}
