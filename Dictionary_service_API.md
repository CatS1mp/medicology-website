# Dictionary Service API

This document describes all REST endpoints currently implemented in this repository (Spring Boot).

## Base URLs

Configured OpenAPI servers (see `SecurityConfig`):

- Production: `https://dictionary-service-medicology-production.up.railway.app`
- Local: `http://localhost:8082`

All endpoints below are relative to the base URL.

## Swagger / OpenAPI

These routes are publicly accessible (no auth required):

- OpenAPI JSON: `GET /v3/api-docs`
- OpenAPI JSON (grouped): `GET /v3/api-docs/**`
- Swagger UI: `GET /swagger-ui.html`
- Swagger UI assets: `GET /swagger-ui/**`
- Also permitted by security config: `GET /api-docs/**`

## Authentication

### Requirement

By default, **all requests require authentication** except:

- Swagger/OpenAPI routes listed above
- Anything under: `POST/GET/... /api/v1/auth/**` (permitted by security config; note: **this repo does not define those auth endpoints**)

### Header

Send a Bearer token:

- `Authorization: Bearer <JWT>`

### Token expectations

- The JWT `sub` (subject) is treated as the user identifier (the code calls it “email”).
- The JWT is considered valid only if it contains a claim `type` equal to `"access"`.
- The JWT signature is verified using `jwt.secret` (application config property).

### Important implementation note

Some controllers currently generate a `userId` using `UUID.randomUUID()` for comment/vote/view/bookmark actions. That means:

- Authentication is still required by Spring Security, but
- The authenticated identity is **not** currently used to determine the acting user for these endpoints.

## Content types

- Requests with a body: `Content-Type: application/json`
- Most responses: JSON
- Some responses: empty body with HTTP `200 OK`

## Data models

### ArticleRequest

```json
{
  "name": "string",
  "slug": "string",
  "contentMarkdown": "string",
  "themeId": "uuid",
  "authorAdminId": "uuid"
}
```

### ArticleResponse

```json
{
  "id": "uuid",
  "themeId": "uuid",
  "name": "string",
  "slug": "string",
  "contentMarkdown": "string",
  "authorAdminId": "uuid",
  "isPublished": true,
  "publishedAt": "2026-04-02T12:34:56",
  "createdAt": "2026-04-02T12:34:56",
  "updatedAt": "2026-04-02T12:34:56",
  "tags": [
    {
      "id": "uuid",
      "name": "string",
      "createdAt": "2026-04-02T12:34:56"
    }
  ]
}
```

Notes:
- In the current service implementation, `tags` is not populated in `ArticleService.mapToResponse(...)` and may be `null`.

### TagRequest

```json
{ "name": "string" }
```

### TagResponse

```json
{
  "id": "uuid",
  "name": "string",
  "createdAt": "2026-04-02T12:34:56"
}
```

### CommentRequest

```json
{ "commentText": "string" }
```

### CommentResponse

```json
{
  "id": "uuid",
  "userId": "uuid",
  "commentText": "string",
  "isApproved": true,
  "createdAt": "2026-04-02T12:34:56",
  "replies": [
    {
      "id": "uuid",
      "userId": "uuid",
      "commentText": "string",
      "isApproved": true,
      "createdAt": "2026-04-02T12:34:56",
      "replies": []
    }
  ]
}
```

Notes:
- `GET` comments returns **only approved** top-level comments.
- Replies are included only if they are approved.

### VoteRequest

```json
{ "voteType": "string" }
```

Notes:
- `voteType` is stored as-is (no enum validation in current code).

## Error responses

### Global error format

The global exception handler returns:

```json
{
  "status": 500,
  "message": "Hệ thống gặp sự cố bất ngờ. Vui lòng thử lại sau!",
  "timestamp": "2026-04-02T12:34:56"
}
```

### Common status codes (current behavior)

- `401 Unauthorized` / `403 Forbidden`: when Spring Security blocks access (missing/invalid auth)
- `500 Internal Server Error`: for most thrown exceptions (including “not found” cases in several services)

Note:
- Some “not found” cases throw `RuntimeException` or `NoSuchElementException` and are currently handled as `500` by the global handler.

---

# Endpoints

## Articles

Base path: `/api/dictionary/articles`

### Create article

- `POST /api/dictionary/articles`
- Auth: required
- Body: `ArticleRequest`
- Response: `200 OK` with body: `"uuid"` (article id)

Example:

```bash
curl -X POST "$BASE/api/dictionary/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aspirin",
    "slug": "aspirin",
    "contentMarkdown": "# Aspirin\n...",
    "themeId": "00000000-0000-0000-0000-000000000001",
    "authorAdminId": "00000000-0000-0000-0000-000000000002"
  }'
```

### List all articles

- `GET /api/dictionary/articles`
- Auth: required
- Response: `200 OK` with body: `ArticleResponse[]`

### Get article by slug (published only)

- `GET /api/dictionary/articles/{slug}`
- Auth: required
- Path params:
  - `slug` (string)
- Response: `200 OK` with body: `ArticleResponse`

Notes:
- Only returns articles where `isPublished = true`.

### Update article

- `PUT /api/dictionary/articles/{id}`
- Auth: required
- Path params:
  - `id` (uuid)
- Body: `ArticleRequest`
- Response: `200 OK` (empty body)

Notes:
- Current implementation updates: `name`, `slug`, `contentMarkdown`, `themeId`.
- Current implementation does **not** update `authorAdminId`.

### Delete article

- `DELETE /api/dictionary/articles/{id}`
- Auth: required
- Path params:
  - `id` (uuid)
- Response: `200 OK` (empty body)

### Publish article

- `POST /api/dictionary/articles/{id}/publish`
- Auth: required
- Path params:
  - `id` (uuid)
- Response: `200 OK` (empty body)

Notes:
- Sets `isPublished = true` and `publishedAt = now`.

### Assign tags to article

- `POST /api/dictionary/articles/{id}/tags`
- Auth: required
- Path params:
  - `id` (uuid)
- Body: JSON array of tag ids: `uuid[]`
- Response: `200 OK` (empty body)

Example body:

```json
[
  "00000000-0000-0000-0000-000000000010",
  "00000000-0000-0000-0000-000000000011"
]
```

Notes:
- This call first deletes existing tag links for the article, then creates links for the provided ids.

## Tags

Base path: `/api/dictionary/tags`

### Create tag

- `POST /api/dictionary/tags`
- Auth: required
- Body: `TagRequest`
- Response: `200 OK` with body: `TagResponse`

### List all tags

- `GET /api/dictionary/tags`
- Auth: required
- Response: `200 OK` with body: `TagResponse[]`

### Get tag by id

- `GET /api/dictionary/tags/{id}`
- Auth: required
- Path params:
  - `id` (uuid)
- Response: `200 OK` with body: `TagResponse`

### Update tag

- `PUT /api/dictionary/tags/{id}`
- Auth: required
- Path params:
  - `id` (uuid)
- Body: `TagRequest`
- Response: `200 OK` (empty body)

### Delete tag

- `DELETE /api/dictionary/tags/{id}`
- Auth: required
- Path params:
  - `id` (uuid)
- Response: `200 OK` (empty body)

## Comments

Base path: `/api/dictionary`

### Create comment on an article

- `POST /api/dictionary/articles/{articleId}/comments`
- Auth: required
- Path params:
  - `articleId` (uuid)
- Body: `CommentRequest`
- Response: `200 OK` with body: `"uuid"` (comment id)

Notes:
- New comments are created with `isApproved = false`.

### List approved comments for an article

- `GET /api/dictionary/articles/{articleId}/comments`
- Auth: required
- Path params:
  - `articleId` (uuid)
- Response: `200 OK` with body: `CommentResponse[]`

Notes:
- Returns only approved top-level comments.
- Each comment includes only approved replies.

### Reply to a comment

- `POST /api/dictionary/comments/{id}/reply`
- Auth: required
- Path params:
  - `id` (uuid) — parent comment id
- Body: `CommentRequest`
- Response: `200 OK` with body: `"uuid"` (reply id)

Notes:
- Replies are created with `isApproved = false`.

### Approve a comment

- `POST /api/dictionary/comments/{id}/approve`
- Auth: required
- Path params:
  - `id` (uuid)
- Response: `200 OK` (empty body)

### Vote on a comment

- `POST /api/dictionary/comments/{id}/vote`
- Auth: required
- Path params:
  - `id` (uuid)
- Body: `VoteRequest`
- Response: `200 OK` (empty body)

Notes:
- Creates or updates the user’s vote record for this comment.

## Interactions (views & bookmarks)

Base path: `/api/dictionary/articles/{articleId}`

### Record a view

- `POST /api/dictionary/articles/{articleId}/view`
- Auth: required
- Path params:
  - `articleId` (uuid)
- Response: `200 OK` (empty body)

Notes:
- If a view record exists for `(userId, articleId)`, increments `viewCount` and updates `lastViewedAt`.
- Otherwise creates a new record with `viewCount = 1`.

### Toggle bookmark

- `POST /api/dictionary/articles/{articleId}/bookmark`
- Auth: required
- Path params:
  - `articleId` (uuid)
- Response: `200 OK` (empty body)

Notes:
- If the bookmark exists for `(userId, articleId)`, it is deleted.
- Otherwise, a new bookmark is created.
