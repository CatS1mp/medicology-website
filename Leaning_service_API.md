# Learning Service API (Medicology)

## Overview
This service exposes learning content (themes/courses), progress tracking, tests/quizzes, and AI feedback.

- **Base path:** `/api/v1/learning`
- **Content type:** `application/json`
- **Auth:** JWT Bearer (required for all learning endpoints)

> Notes
> - Most endpoints return JPA entities directly. Fields shown below reflect the entity classes in `src/main/java/com/medicology/learning/entity/*`.
> - Several entities have `LAZY` relations (`Course.section`, `Section.theme`, etc.). Depending on Jackson/Hibernate configuration, those nested objects may serialize as `null`, as an object, or could error if the session is closed.

## Swagger / OpenAPI
Swagger endpoints are publicly accessible:

- `/swagger-ui.html`
- `/swagger-ui/**`
- `/v3/api-docs` and `/v3/api-docs/**`

The OpenAPI config declares a global `bearerAuth` security scheme, so Swagger UI may prompt for a token to “Try it out”, even though the Swagger endpoints themselves are not protected.

## Authentication & Authorization (How it works)

### What is protected
In `SecurityConfig`:

- `permitAll()` for:
  - Swagger endpoints (`/v3/api-docs/**`, `/swagger-ui/**`, etc.)
  - Auth endpoints `/api/v1/auth/**` (implemented in a different service or module; not in this repository)
- `authenticated()` for **everything else**
- Stateless sessions (`SessionCreationPolicy.STATELESS`)

### What token is expected
`JwtAuthenticationFilter` expects the request header:

```
Authorization: Bearer <JWT>
```

The token must:

- Be a signed JWT verifiable with the configured secret: `jwt.secret`
- Have **subject (`sub`) = user email** (the code calls it “identifier”)
- Contain claim `type` and it must equal `"access"`

Typical payload shape (example):

```json
{
  "sub": "user@example.com",
  "type": "access",
  "exp": 1760000000
}
```

### How the user identity is derived
If the token is valid, the filter sets a Spring Security `Authentication` where:

- **Principal** = the email string from `sub`
- **Authorities** = `["ROLE_USER"]`

Controllers read the email via `@AuthenticationPrincipal String email`.

### How `userId` is derived in this service
# Learning Service API (Medicology)

## Overview
This service exposes learning content (themes/sections/courses), progress tracking, and AI feedback.

- **Base path:** `/api/v1/learning`
- **Content type:** `application/json`
- **Auth:** JWT Bearer (required for all non-Swagger endpoints)

> Notes
> - Responses are a mix of **JPA entities** (e.g. `Theme`, `Course`, `UserCourse`) and **DTOs** (e.g. `ThemeResponse`, `SectionResponse`, `CourseResponse`).
> - Several entities have `LAZY` relations (`Course.section`, `Section.theme`, etc.). Depending on Jackson/Hibernate configuration, those nested objects may serialize as `null`, as an object, or error if the session is closed.
> - “Tests/Quizzes” endpoints are **not implemented** in this repository (no `/tests/**` controller/entities).

## Swagger / OpenAPI
Swagger endpoints are publicly accessible:

- `/swagger-ui.html` (typically redirects)
- `/swagger-ui/**` (UI assets; main page is usually `/swagger-ui/index.html`)
- `/v3/api-docs` and `/v3/api-docs/**`
- `/api-docs/**` (also permitted by security config)

The OpenAPI config declares a global `bearerAuth` security scheme, so Swagger UI may prompt for a token to “Try it out”, even though the Swagger endpoints themselves are not protected.

`GET /` redirects to `/swagger-ui/index.html`.

## Authentication & Authorization (How it works)

### What is protected
In `SecurityConfig`:

- `permitAll()` for:
  - Swagger endpoints (`/v3/api-docs/**`, `/swagger-ui/**`, `/api-docs/**`, etc.)
  - Auth endpoints `/api/v1/auth/**` (implemented in a different service/module; not in this repository)
- `authenticated()` for **everything else**
- Stateless sessions (`SessionCreationPolicy.STATELESS`)

### What token is expected
`JwtAuthenticationFilter` expects the request header:

```
Authorization: Bearer <JWT>
```

The token must:

- Be a signed JWT verifiable with the configured secret: `jwt.secret`
- Have **subject (`sub`) = user email**
- Contain claim `type` and it must equal `"access"`

Typical payload shape (example):

```json
{
  "sub": "user@example.com",
  "type": "access",
  "exp": 1760000000
}
```

### How the user identity is derived
If the token is valid, the filter sets a Spring Security `Authentication` where:

- **Principal** = the email string from `sub`
- **Authorities** = `["ROLE_USER"]`

Most controllers read the email via `@AuthenticationPrincipal String email`.

### How `userId` is derived in this service
This service currently does **not** look up a real user UUID from a user table. Instead it derives a stable UUID from the email:

- `UUID.nameUUIDFromBytes(email.getBytes())`

That UUID is used as `userId` when storing progress and AI feedback.

### Important behavior for invalid tokens
If JWT parsing/validation throws an exception, the filter throws `RuntimeException("Lỗi xác thực JWT: ...")`.
Because of `GlobalExceptionHandler`, that will typically become a **500** response with a generic message, so clients may see `500` instead of `401` for malformed tokens.

## Error responses
Many service methods throw `IllegalArgumentException` (e.g. “Course not found”). `GlobalExceptionHandler` maps:

- `IllegalArgumentException` -> **401 Unauthorized** with body:
  ```json
  {"status":401,"message":"...","timestamp":"..."}
  ```
- `MethodArgumentNotValidException` -> **400 Bad Request** with body:
  ```json
  {"status":400,"message":"...","timestamp":"..."}
  ```
- Other unexpected exceptions -> **500 Internal Server Error** with body:
  ```json
  {"status":500,"message":"Hệ thống gặp sự cố bất ngờ. Vui lòng thử lại sau!","timestamp":"..."}
  ```

> Note: returning 401 for “not found” is likely not intended, but it is the current behavior.

---

# Endpoints

## Themes (DTO)

### GET `/api/v1/learning/themes`
Returns all themes.

- **Auth:** required
- **Response:** `200 OK` -> `ThemeResponse[]`

`ThemeResponse` fields:

```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string|null",
  "iconFileName": "string|null",
  "colorCode": "string|null",
  "orderIndex": 1,
  "createdAt": "2026-04-01T12:00:00",
  "updatedAt": "2026-04-01T12:00:00"
}
```

### POST `/api/v1/learning/themes`
Creates a theme.

- **Auth:** required
- **Body:** `ThemeRequest`
  ```json
  {
    "name": "string",
    "slug": "string",
    "description": "string|null",
    "iconFileName": "string|null",
    "colorCode": "string|null",
    "orderIndex": 1
  }
  ```
- **Response:** `201 Created` -> `ThemeResponse`

### PUT `/api/v1/learning/themes/{themeId}`
Updates a theme.

- **Auth:** required
- **Path param:** `themeId` (UUID)
- **Body:** `ThemeRequest`
- **Response:** `200 OK` -> `ThemeResponse`

### DELETE `/api/v1/learning/themes/{themeId}`
Deletes a theme.

- **Auth:** required
- **Path param:** `themeId` (UUID)
- **Response:** `204 No Content`

---

## Sections (DTO)

### GET `/api/v1/learning/themes/{themeId}/sections`
Returns sections that belong to a theme.

- **Auth:** required
- **Path param:** `themeId` (UUID)
- **Response:** `200 OK` -> `SectionResponse[]`

`SectionResponse` fields:

```json
{
  "id": "uuid",
  "themeId": "uuid",
  "name": "string",
  "slug": "string",
  "orderIndex": 1,
  "estimatedDurationMinutes": 30,
  "createdAt": "2026-04-01T12:00:00",
  "updatedAt": "2026-04-01T12:00:00"
}
```

### POST `/api/v1/learning/courses/{courseId}/sections`
Creates a section.

- **Auth:** required
- **Path param:** `courseId` (UUID)
- **Body:** `SectionRequest`
  ```json
  {
    "themeId": "uuid",
    "name": "string",
    "slug": "string",
    "orderIndex": 1,
    "estimatedDurationMinutes": 30
  }
  ```
- **Response:** `201 Created` -> `SectionResponse`

> Note: In the current controller implementation, `courseId` is not used (the service creates sections from `themeId` in the body).

### PUT `/api/v1/learning/sections/{sectionId}`
Updates a section.

- **Auth:** required
- **Path param:** `sectionId` (UUID)
- **Body:** `SectionRequest`
- **Response:** `200 OK` -> `SectionResponse`

### DELETE `/api/v1/learning/sections/{sectionId}`
Deletes a section.

- **Auth:** required
- **Path param:** `sectionId` (UUID)
- **Response:** `204 No Content`

---

## Courses (mixed: entities + DTO)

### GET `/api/v1/learning/courses`
Returns all themes (despite the method name `getAllCourses()`).

- **Auth:** required
- **Response:** `200 OK` -> `Theme[]` (entity)

`Theme` (entity) fields:

```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string|null",
  "iconFileName": "string|null",
  "colorCode": "string|null",
  "orderIndex": 1,
  "createdAt": "2026-04-01T12:00:00",
  "updatedAt": "2026-04-01T12:00:00"
}
```

### GET `/api/v1/learning/courses/path`
Returns a “learning path” wrapper object.

- **Auth:** required
- **Response:** `200 OK` -> `{ "themes": Theme[] }`

Example response:

```json
{
  "themes": [{"id":"...","name":"..."}]
}
```

### GET `/api/v1/learning/courses/{courseId}`
Returns a course.

- **Auth:** required
- **Path param:** `courseId` (UUID)
- **Response:** `200 OK` -> `Course` (entity)

`Course` (entity) fields:

```json
{
  "id": "uuid",
  "section": {"id":"uuid"},
  "name": "string",
  "description": "string|null",
  "slug": "string",
  "orderIndex": 1,
  "estimatedDurationMinutes": 7,
  "difficultyLevel": "beginner",
  "isActive": true,
  "content": "{ ... JSON string ... }",
  "createdAt": "2026-04-01T12:00:00",
  "updatedAt": "2026-04-01T12:00:00"
}
```

### POST `/api/v1/learning/courses`
Creates a course.

- **Auth:** required
- **Body:** `CourseRequest`
  ```json
  {
    "sectionId": "uuid",
    "name": "string",
    "description": "string|null",
    "slug": "string",
    "orderIndex": 1,
    "estimatedDurationMinutes": 7,
    "difficultyLevel": "beginner",
    "isActive": true,
    "content": "{ ... JSON string ... }"
  }
  ```
- **Response:** `201 Created` -> `CourseResponse`

### PUT `/api/v1/learning/courses/{courseId}`
Updates a course.

- **Auth:** required
- **Path param:** `courseId` (UUID)
- **Body:** `CourseRequest`
- **Response:** `200 OK` -> `CourseResponse`

### PATCH `/api/v1/learning/courses/{courseId}/status`
Updates only the `isActive` status.

- **Auth:** required
- **Path param:** `courseId` (UUID)
- **Body:**
  ```json
  {"isActive": true}
  ```
- **Response:** `200 OK` -> `CourseResponse`

### DELETE `/api/v1/learning/courses/{courseId}`
Deletes a course.

- **Auth:** required
- **Path param:** `courseId` (UUID)
- **Response:** `204 No Content`

### POST `/api/v1/learning/courses/{courseId}/enroll`
Enrolls the current user in a course (creates `user_course` row if missing).

- **Auth:** required
- **Path param:** `courseId` (UUID)
- **Body:** none
- **Response:** `200 OK` -> string: `"Enrolled successfully"`

> Note: This endpoint currently expects `@AuthenticationPrincipal UserPrincipal user`, but the JWT filter sets the principal to a `String` email. As-is, this can result in a runtime error until the controller is aligned with the filter.

---

## Progress (entities)

### GET `/api/v1/learning/progress`
Returns course progress records for the current user (userId derived from token email).

- **Auth:** required
- **Response:** `200 OK` -> `UserCourse[]` (entity)

`UserCourse` fields:

```json
{
  "userId": "uuid",
  "courseId": "uuid",
  "course": {"id":"uuid"},
  "quizzesCorrect": 0,
  "completedAt": "2026-04-01T12:00:00"
}
```

### GET `/api/v1/learning/progress/{userId}`
Returns progress records for the specified userId.

- **Auth:** required
- **Path param:** `userId` (UUID)
- **Response:** `200 OK` -> `UserCourse[]`

### POST `/api/v1/learning/progress/streak/ping`
Updates (or initializes) the user’s daily streak (userId derived from token email).

- **Auth:** required
- **Body:** none
- **Response:** `200 OK` -> `UserDailyStreak` (entity)

`UserDailyStreak` fields:

```json
{
  "userId": "uuid",
  "currentStreak": 1,
  "longestStreak": 1,
  "lastActivityDate": "2026-04-01",
  "streakStartedAt": "2026-04-01",
  "totalActiveDays": 1,
  "createdAt": "2026-04-01T12:00:00",
  "updatedAt": "2026-04-01T12:00:00"
}
```

---

## AI Feedback (mixed: entity + DTO)

### POST `/api/v1/learning/ai-feedback`
Generates (mocked) AI feedback and stores it.

- **Auth:** required
- **Body:**
  ```json
  {
    "referenceId": "uuid",
    "referenceType": "COURSE|SECTION|TEST",
    "questionContent": "string",
    "userAnswer": "string",
    "isCorrect": true
  }
  ```
- **Response:** `200 OK` -> `AiLearningFeedback` (entity)

`AiLearningFeedback` fields:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "referenceId": "uuid",
  "referenceType": "string",
  "questionContent": "string",
  "userAnswer": "string",
  "isCorrect": true,
  "aiExplanation": "string",
  "createdAt": "2026-04-01T12:00:00"
}
```

> Note: The controller currently accepts the request body as an untyped `Map<String,Object>` and casts fields directly, so types must match (e.g. `isCorrect` must be a JSON boolean).

### GET `/api/v1/learning/ai-feedback`
Returns all stored feedback entries.

- **Auth:** required
- **Response:** `200 OK` -> `AiFeedbackResponse[]`

### PUT `/api/v1/learning/ai-feedback/{id}`
Updates a feedback entry.

- **Auth:** required
- **Path param:** `id` (UUID)
- **Body:**
  ```json
  {
    "aiExplanation": "string",
    "isCorrect": true
  }
  ```
- **Response:** `200 OK` -> `AiFeedbackResponse`

### DELETE `/api/v1/learning/ai-feedback/{id}`
Deletes a feedback entry.

- **Auth:** required
- **Path param:** `id` (UUID)
- **Response:** `204 No Content`

---

# Running locally (quick)
If you have Java 17+ and Maven installed, you can run:

```bash
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
./mvnw.cmd spring-boot:run
```

## Configuration notes
This service requires `jwt.secret` to validate incoming JWTs.

Provide it via environment variable (Spring Boot relaxed binding):

```powershell
setx JWT_SECRET "your-very-long-hmac-secret"
```

Or via JVM property:

```bash
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Djwt.secret=your-very-long-hmac-secret"
```

## Ports
This repo does not include an `application.properties`, so Spring Boot defaults to port `8080` unless configured.

- Dockerfile exposes `8081`. If you want to run on `8081`, set `SERVER_PORT=8081` (or `-Dserver.port=8081`).

Then open Swagger UI at:

- `http://localhost:8080/swagger-ui/index.html` (default)
- `http://localhost:8081/swagger-ui/index.html` (if configured)

To call protected endpoints, obtain an **access** JWT from your Auth service and pass it as `Authorization: Bearer <token>`.
