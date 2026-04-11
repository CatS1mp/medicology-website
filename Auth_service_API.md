# Medicology Auth Service API

Base path: `/api/v1/auth`

## Authentication

- All endpoints under `/api/v1/auth/**` are currently **public** (no Bearer token required) per the security configuration.
- Other endpoints outside this path may require `Authorization: Bearer <accessToken>`.

## Interactive docs (Swagger)

- Swagger UI: `/swagger-ui.html`
- OpenAPI JSON: `/api-docs`

## Common responses

### Error response

When an error occurs, the service returns this JSON shape:

```json
{
  "status": 401,
  "message": "...",
  "timestamp": "2026-03-28T20:56:27.000"
}
```

Notes:
- Validation errors typically return HTTP `400`.
- Most domain/logic errors are thrown as `IllegalArgumentException` and return HTTP `401`.
- Unexpected errors return HTTP `500`.

---

## Endpoints

### Register

`POST /api/v1/auth/register`

Creates a new user and sends a verification email.

Request body:

```json
{
  "username": "string",
  "email": "user@example.com",
  "password": "string",
  "confirmPassword": "string"
}
```

Response: `201 Created`

```json
{
  "email": "user@example.com"
}
```

---

### Login

`POST /api/v1/auth/login`

Authenticates by email/password.

Request body:

```json
{
  "email": "user@example.com",
  "password": "string"
}
```

Response: `200 OK`

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 1800,
  "userProfile": {
    "displayName": "string",
    "avatarUrl": "string",
    "bio": "string"
  }
}
```

---

### OAuth post-login

`POST /api/v1/auth/oauth`

Used after OAuth login on the client side. Creates the user if needed and returns tokens.

Request body:

```json
{
  "email": "user@example.com",
  "name": "Display Name",
  "facebookId": "string (optional)",
  "googleId": "string (optional)"
}
```

Response: `200 OK`

Same shape as **Login**.

---

### Verify email

`GET /api/v1/auth/verify?token=<uuid>`

Marks the user as verified if the verification token is valid and not expired.

Query params:
- `token` (UUID) — verification token

Response: `200 OK`

Plain text message:

```text
Email verified successfully!
```

---

### Request password reset

`POST /api/v1/auth/reset/request?email=<email>`

Generates a reset token and sends a reset email.

Query params:
- `email` (string)

Response: `200 OK`

Plain text message:

```text
Reset link has been sent to your email.
```

---

### Reset password

`POST /api/v1/auth/reset`

Resets the password using a reset token.

Request body:

```json
{
  "token": "00000000-0000-0000-0000-000000000000",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

Response: `200 OK`

Plain text message:

```text
Password has been reset successfully.
```

---

### Logout

`POST /api/v1/auth/logout`

Revokes the provided refresh token (if present).

Headers:
- `Authorization` is accepted but optional; current implementation only revokes by refresh token.

Request body (optional):

```json
{
  "refreshToken": "..."
}
```

Response: `200 OK`

Plain text message:

```text
Logged out successfully. Refresh token revoked.
```

---

### Refresh access token

`POST /api/v1/auth/refresh`

Exchanges a refresh token for a new access token and a new refresh token.

Important behavior:
- The old refresh token is **revoked** (refresh token rotation).

Request body:

```json
{
  "refreshToken": "..."
}
```

Response: `200 OK`

Same shape as **Login**.
