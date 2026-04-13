import { buildHeaders, requestApi, unwrapSpringData } from '@/shared/api/http';
import type { AdminUserApiRecord, AdminUserListResult, AuthAdminUserDetailResponse, AuthUserResponseDTO } from '@/shared/types/admin';
import {
    mapAuthAdminUserDetailToRecord,
    mapAuthUserResponseToRecord,
    normalizeSpringListPayload,
    splitVietnameseFullName,
} from '@/shared/types/admin';

const API_ADMIN = '/api/admin';
const API_PROFILES = '/api/profiles';

export async function fetchAdminUsers(params?: { page?: number; size?: number }): Promise<AdminUserListResult> {
    const search = new URLSearchParams();
    if (params?.page !== undefined) search.set('page', String(params.page));
    if (params?.size !== undefined) search.set('size', String(params.size));
    const q = search.toString();
    const url = `${API_ADMIN}/users${q ? `?${q}` : ''}`;

    const rawBody = await requestApi<unknown>(
        url,
        {
            method: 'GET',
            headers: buildHeaders({ includeJsonContentType: false }),
        },
        { unwrapData: false }
    );
    const data = unwrapSpringData<unknown>(rawBody);
    const normalized = normalizeSpringListPayload<AuthUserResponseDTO>(data);
    const items = normalized.items.map((u) => mapAuthUserResponseToRecord(u));
    return { items, total: normalized.total };
}

/** GET /api/v1/admin/users/{id} — auth-service `AdminUserDetailResponseDTO` (user + profile + …). */
export async function fetchAdminUserProfile(userId: string): Promise<AdminUserApiRecord> {
    const rawBody = await requestApi<unknown>(
        `${API_ADMIN}/users/${encodeURIComponent(userId)}`,
        {
            method: 'GET',
            headers: buildHeaders({ includeJsonContentType: false }),
        },
        { unwrapData: false }
    );
    const data = unwrapSpringData<unknown>(rawBody) as AuthAdminUserDetailResponse;
    return mapAuthAdminUserDetailToRecord(data);
}

/** PATCH /api/v1/admin/users/{id}/status — body `{ active: boolean }` on auth-service. */
export async function patchAdminUserStatus(userId: string, status: 'ACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION'): Promise<void> {
    const active = status !== 'LOCKED';
    await requestApi<unknown>(`${API_ADMIN}/users/${encodeURIComponent(userId)}/status`, {
        method: 'PATCH',
        headers: buildHeaders(),
        body: JSON.stringify({ active }),
    });
}

/** Payload for admin-created student — field names align with common Spring DTOs; backend may map synonyms. */
export interface AdminCreateStudentPayload {
    fullName: string;
    email: string;
    username: string;
    password?: string;
    dateOfBirth?: string;
    phone?: string;
    targetAudience?: string;
}

export async function createAdminStudent(payload: AdminCreateStudentPayload): Promise<void> {
    await requestApi<unknown>(`${API_ADMIN}/users`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
    });
}

export async function deleteAdminUser(userId: string): Promise<void> {
    await requestApi<unknown>(`${API_ADMIN}/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: buildHeaders({ includeJsonContentType: false }),
    });
}

/** Maps to auth-service `UpdateProfileRequestDTO` — PUT /api/v1/profiles/{userId}. */
export interface AdminUpdateUserPayload {
    fullName: string;
    username?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
    bio?: string;
    /** Not supported by auth-service profile API yet; ignored when saving. */
    targetAudience?: string;
}

/** PUT /api/v1/profiles/{id} — cập nhật hồ sơ (username, lastName, firstName, …). */
export async function updateAdminUser(userId: string, payload: AdminUpdateUserPayload): Promise<void> {
    const { lastName, firstName } = splitVietnameseFullName(payload.fullName);

    const dto: Record<string, unknown> = {
        lastName: lastName ?? '',
        firstName: firstName ?? '',
    };

    const un = payload.username?.trim();
    if (un && un.length >= 3) {
        dto.username = un;
    }

    if (payload.dateOfBirth) {
        dto.dateOfBirth = payload.dateOfBirth;
    }
    if (payload.gender !== undefined) {
        dto.gender = payload.gender.trim();
    }
    if (payload.address !== undefined) {
        dto.address = payload.address.trim();
    }
    if (payload.bio !== undefined) {
        dto.bio = payload.bio.trim();
    }

    await requestApi<unknown>(`${API_PROFILES}/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify(dto),
    });
}
