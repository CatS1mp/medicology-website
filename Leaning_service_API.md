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
This service currently does **not** look up a real user UUID from a user table.
Instead it derives a stable “fake” UUID from the email:

- `UUID.nameUUIDFromBytes(email.getBytes())`

That UUID is then used as `userId` for storing progress/test results.

### Important behavior for invalid tokens
If JWT parsing/validation throws an exception, the filter throws `RuntimeException("Lỗi xác thực JWT: ...")`.
Because of `GlobalExceptionHandler`, that will typically become a **500** response with a generic message.
So clients may see `500` instead of `401` for malformed/expired tokens.

## Error responses
A number of service methods throw `IllegalArgumentException` (ex: “Course not found”).
`GlobalExceptionHandler` maps:

- `IllegalArgumentException` -> **401 Unauthorized** with body:
  ```json
  {"status":401,"message":"...","timestamp":"..."}
  ```
- Other unexpected exceptions -> **500** with body:
  ```json
  {"status":500,"message":"Hệ thống gặp sự cố bất ngờ. Vui lòng thử lại sau!","timestamp":"..."}
  ```

> Note: returning 401 for “not found” is likely not intended, but it is the current behavior.

---

# Endpoints

## Courses
### GET `/api/v1/learning/courses`
Returns all themes (despite method name `getAllCourses()`).

- **Auth:** required
- **Response:** `200 OK` -> `Theme[]`

`Theme` fields (see entity `Theme`):

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

Example:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/learning/courses
```

### GET `/api/v1/learning/courses/path`
Returns a “learning path” wrapper object.

- **Auth:** required
- **Response:** `200 OK` -> `{ "themes": Theme[] }`

Example response:

```json
{
  "themes": [ {"id":"...","name":"..."} ]
}
```

### GET `/api/v1/learning/courses/{courseId}`
Returns a course and its JSON content.

- **Auth:** required
- **Path param:** `courseId` (UUID)
- **Response:** `200 OK` -> `Course`

`Course` fields:

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

### POST `/api/v1/learning/courses/{courseId}/enroll`
Enrolls the current user in a course (creates `user_course` row if missing).

- **Auth:** required
- **Path param:** `courseId` (UUID)
- **Body:** none
- **Response:** `200 OK` -> string: `"Enrolled successfully"`

Example:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/learning/courses/$COURSE_ID/enroll
```

---

## Progress
### GET `/api/v1/learning/progress`
Returns course progress records for the current user.

- **Auth:** required
- **Response:** `200 OK` -> `UserCourse[]`

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

### POST `/api/v1/learning/progress/streak/ping`
Updates (or initializes) the user’s daily streak.

- **Auth:** required
- **Body:** none
- **Response:** `200 OK` -> `UserDailyStreak`

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

## Tests
### GET `/api/v1/learning/tests/section/{sectionId}`
Returns the test definition for a section.

- **Auth:** required
- **Path param:** `sectionId` (UUID)
- **Response:** `200 OK` -> `SectionTest`

`SectionTest` fields:

```json
{
  "sectionId": "uuid",
  "section": {"id":"uuid"},
  "name": "string",
  "passingScorePercentage": 70.0,
  "timeLimitMinutes": 30,
  "maxAttempts": 3,
  "isActive": true,
  "content": "{ ... JSON string ... }",
  "createdAt": "2026-04-01T12:00:00",
  "updatedAt": "2026-04-01T12:00:00"
}
```

### POST `/api/v1/learning/tests/course/{courseId}/submit`
Submits the number of correct quizzes for a course.

- **Auth:** required
- **Path param:** `courseId` (UUID)
- **Body:**
  ```json
  {"quizzesCorrect": 7}
  ```
- **Response:** `200 OK` -> `"Course quiz submitted"`

### POST `/api/v1/learning/tests/section/{sectionId}/submit`
Submits a section test result. The server computes pass/fail using:

- $percentage = quizzesCorrect / totalQuestions \times 100$
- `passed = percentage >= passingScorePercentage`

- **Auth:** required
- **Path param:** `sectionId` (UUID)
- **Body:**
  ```json
  {"quizzesCorrect": 8, "totalQuestions": 10}
  ```
  If `totalQuestions` is omitted, it defaults to `10`.
- **Response:** `200 OK` -> `"Section test submitted"`

### GET `/api/v1/learning/tests/results`
Returns section test results for the current user.

- **Auth:** required
- **Response:** `200 OK` -> `UserSectionTest[]`

`UserSectionTest` fields:

```json
{
  "userId": "uuid",
  "sectionTestId": "uuid",
  "sectionTest": {"sectionId":"uuid"},
  "quizzesCorrect": 0,
  "totalQuestions": 10,
  "passed": false,
  "completedAt": "2026-04-01T12:00:00"
}
```

---

## AI Feedback
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
- **Response:** `200 OK` -> `AiLearningFeedback`

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

---

# Running locally (quick)
If you have Java + Maven installed, you can typically run:

```bash
./mvnw spring-boot:run
```

## Configuration notes
This service requires `jwt.secret` to validate incoming JWTs.

You can provide it via environment variable (Spring Boot relaxed binding):

```bash
set JWT_SECRET=your-very-long-hmac-secret
```

Or via JVM property:

```bash
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Djwt.secret=your-very-long-hmac-secret"
```

Then open:

- Swagger UI: `http://localhost:8080/swagger-ui.html`

To call protected endpoints, obtain an **access** JWT from your Auth service and pass it as `Authorization: Bearer <token>`.
