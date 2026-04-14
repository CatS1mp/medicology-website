# API Cache Strategy and Rollout

## 0) API surfaces in this project

| Next route surface | Upstream mapping |
|---|---|
| `/api/learning/*` | `LEARNING_SERVICE_URL + /api/v1/learning/*` |
| `/api/assessment/*` | `ASSESSMENT_SERVICE_URL + /api/v1/*` |
| `/api/dictionary/*` | `DICTIONARY_SERVICE_URL + /api/dictionary/*` |
| `/api/admin/*` | `AUTH_SERVICE_URL + /api/v1/admin/*` |
| `/api/auth/*` | `AUTH_SERVICE_URL + /api/v1/auth/*` |
| `/api/users/*` | `AUTH_SERVICE_URL + /api/v1/users/*` |
| `/api/profiles/*` | `AUTH_SERVICE_URL + /api/v1/profiles/*` |
| `/api/settings/*` | `AUTH_SERVICE_URL + /api/v1/settings/*` |
| `/api/oauth/*` | `AUTH_SERVICE_URL + /api/v1/oauth/*` |
| `/api/sessions/*` | `AUTH_SERVICE_URL + /api/v1/sessions/*` |

## 1) Full API catalog and cache decision

### Cache tiers
- `NO_CACHE`: always fetch fresh, never store response.
- `TTL_30S`: short-lived cache for hot read data.
- `TTL_2M`: medium cache for semi-dynamic read data.
- `TTL_10M`: long cache for mostly static catalog/content.

### A. Learning APIs (`src/shared/api/learning.ts`)

| Function | Method/Path | Type | Volatility | Decision | Refresh trigger |
|---|---|---|---|---|---|
| `getCourses` | `GET /api/learning/courses` | Query | Medium | `TTL_10M` | Expiry; invalidate on course CRUD (admin) |
| `getThemes` | alias of `getCourses` | Query | Medium | `TTL_10M` | Same as `getCourses` |
| `getEnrolledCourses` | `GET /api/learning/courses/enrolled` | Query | High | `TTL_30S` | Expiry; invalidate after `enrollCourse`, lesson completion, logout |
| `getAvailableStudentCourses` | `GET /api/learning/courses/student/available` | Query | High | `TTL_30S` | Expiry; invalidate after `enrollCourse` |
| `getLearningPath` | `GET /api/learning/courses/path` | Query | Medium | `TTL_2M` | Expiry; invalidate on course/section mutations |
| `getCourseDetail` | `GET /api/learning/courses/{id}` | Query | Medium | `TTL_2M` | Expiry; invalidate on course update/delete |
| `getCourseSections` | `GET /api/learning/courses/{id}/sections` | Query | Medium | `TTL_2M` | Expiry; invalidate on section/lesson mutations |
| `getThemeSections` | alias of `getCourseSections` | Query | Medium | `TTL_2M` | Same as `getCourseSections` |
| `getSectionDetail` | `GET /api/learning/sections/{id}` | Query | Medium | `TTL_2M` | Expiry; invalidate on section update |
| `getSectionLessons` | `GET /api/learning/sections/{id}/lessons` | Query | High | `TTL_30S` | Expiry; invalidate on lesson CRUD/status |
| `getLessonDetail` | `GET /api/learning/lessons/{id}` | Query | High | `TTL_30S` | Expiry; invalidate on lesson update/block-progress |
| `completeLesson` | `POST /api/learning/lessons/{id}/complete` | Mutation | High | `NO_CACHE` | On success invalidate progress/activity/streak |
| `updateLessonBlockProgress` | `PATCH /api/learning/lessons/{lessonId}/blocks/{blockId}/progress` | Mutation | High | `NO_CACHE` | On success invalidate lesson/progress/activity |
| `enrollCourse` | `POST /api/learning/courses/{id}/enroll` | Mutation | High | `NO_CACHE` | On success invalidate available/enrolled/progress |
| `getProgress` | `GET /api/learning/progress` | Query | High | `TTL_30S` | Expiry; invalidate on complete/enroll/block-progress |
| `getLessonActivity` | `GET /api/learning/progress/activity?days={n}` | Query | High | `TTL_30S` | Expiry; invalidate on complete/block-progress |
| `pingStreak` | `POST /api/learning/progress/streak/ping` | Mutation-like write | High | `NO_CACHE` | Always call fresh, optional client debounce 10-30s |
| `requestAiFeedback` | `POST /api/learning/ai-feedback` | Mutation | High | `NO_CACHE` | None |

### B. Assessment APIs (`src/shared/api/assessment.ts`, `src/shared/api/admin-assessment.ts`)

| Function | Method/Path | Type | Volatility | Decision | Refresh trigger |
|---|---|---|---|---|---|
| `getSectionAssessment` | `GET /api/assessment/sections/{sectionId}/assessment` | Query | Medium | `TTL_2M` | Expiry; invalidate if assessment updated |
| `startAttempt` | `POST /api/assessment/assessments/{id}/attempts` | Mutation | High | `NO_CACHE` | None |
| `saveAttemptAnswer` | `POST /api/assessment/attempts/{id}/answers` | Mutation | High | `NO_CACHE` | None |
| `submitAttempt` | `POST /api/assessment/attempts/{id}/submit` | Mutation | High | `NO_CACHE` | Invalidate `my-attempts`, result cache |
| `getAttemptResult` | `GET /api/assessment/attempts/{id}/result` | Query | Low after submit | `TTL_10M` | Expiry; invalidate if re-attempt submitted |
| `getMyAttempts` | `GET /api/assessment/users/me/attempts` | Query | High | `TTL_30S` | Expiry; invalidate after `submitAttempt` |
| `listAssessmentsAdmin` | `GET /api/assessment/assessments` | Query | Medium | `TTL_30S` (admin-only namespace) | Expiry; invalidate after create/update/delete |
| `getAssessmentAdmin` | `GET /api/assessment/assessments/{id}` | Query | Medium | `TTL_30S` (admin-only namespace) | Expiry; invalidate after put/delete |
| `createAssessmentAdmin` | `POST /api/assessment/assessments` | Mutation | High | `NO_CACHE` | Invalidate admin assessment list |
| `putAssessmentAdmin` | `PUT /api/assessment/assessments/{id}` | Mutation | High | `NO_CACHE` | Invalidate list + detail |
| `deleteAssessmentAdmin` | `DELETE /api/assessment/assessments/{id}` | Mutation | High | `NO_CACHE` | Invalidate list + detail |

### C. Dictionary APIs (`src/features/encyclopedia/api.ts`, `src/shared/api/admin-dictionary.ts`)

| Function | Method/Path | Type | Volatility | Decision | Refresh trigger |
|---|---|---|---|---|---|
| `listArticles` | `GET /api/dictionary/articles` | Query | Medium | `TTL_2M` | Expiry; invalidate on admin create/update/publish/delete |
| `getArticleBySlug` | `GET /api/dictionary/articles/{slug}` | Query | Medium | `TTL_2M` | Expiry; invalidate on article update/publish |
| `getInteractionSummary` | `GET /api/dictionary/articles/{id}/interactions/summary` | Query | High | `TTL_30S` | Expiry; invalidate on bookmark/comment/vote/view |
| `getViewStatistics` | `GET /api/dictionary/articles/{id}/views` | Query | High | `TTL_30S` | Expiry; invalidate after `recordArticleView` |
| `getArticleComments` | `GET /api/dictionary/articles/{id}/comments` | Query | High | `TTL_30S` | Expiry; invalidate on create/reply/approve/vote |
| `listBookmarkedArticles` | `GET /api/dictionary/users/me/bookmarks` | Query | High | `TTL_30S` | Expiry; invalidate on bookmark/unbookmark |
| `recordArticleView` | `POST /api/dictionary/articles/{id}/view` | Mutation | High | `NO_CACHE` | None |
| `bookmarkArticle` | `POST /api/dictionary/articles/{id}/bookmark` | Mutation | High | `NO_CACHE` | Invalidate bookmark/interactions |
| `unbookmarkArticle` | `DELETE /api/dictionary/articles/{id}/bookmark` | Mutation | High | `NO_CACHE` | Invalidate bookmark/interactions |
| `createArticleComment` | `POST /api/dictionary/articles/{id}/comments` | Mutation | High | `NO_CACHE` | Invalidate comments/interactions |
| `replyArticleComment` | `POST /api/dictionary/comments/{id}/reply` | Mutation | High | `NO_CACHE` | Invalidate comments/interactions |
| `approveArticleComment` | `POST /api/dictionary/comments/{id}/approve` | Mutation | High | `NO_CACHE` | Invalidate comments/interactions |
| `voteComment` | `POST /api/dictionary/comments/{id}/vote` | Mutation | High | `NO_CACHE` | Invalidate comments/interactions |
| `adminListArticles` | `GET /api/dictionary/articles` | Query | Medium | `TTL_30S` (admin-only namespace) | Expiry; invalidate after admin mutations |
| `adminListTags` | `GET /api/dictionary/tags` | Query | Low | `TTL_10M` | Expiry; invalidate on tag-related mutation (future) |
| `adminCreateArticle` | `POST /api/dictionary/articles` | Mutation | High | `NO_CACHE` | Invalidate article list/detail |
| `adminUpdateArticle` | `PUT /api/dictionary/articles/{id}` | Mutation | High | `NO_CACHE` | Invalidate article list/detail |
| `adminDeleteArticle` | `DELETE /api/dictionary/articles/{id}` | Mutation | High | `NO_CACHE` | Invalidate article list/detail |
| `adminPublishArticle` | `PATCH /api/dictionary/articles/{id}/publish` | Mutation | High | `NO_CACHE` | Invalidate article list/detail |

### D. Auth/User APIs (`src/features/auth/api.ts`, `src/shared/api/admin-users.ts`)

| Function | Method/Path | Type | Volatility | Decision | Refresh trigger |
|---|---|---|---|---|---|
| `register`, `login`, `oauthLogin`, `verifyEmail`, `resend`, `requestPasswordReset`, `resetPassword`, `logout`, `refreshToken` | Auth endpoints | Mutation/Sensitive | High | `NO_CACHE` | Always fresh |
| `getCurrentUser` | `GET /api/users/me` | Query | High | `TTL_30S` | Expiry; invalidate after profile/user updates/login/logout |
| `getCurrentProfile` | `GET /api/profiles/me` | Query | High | `TTL_30S` | Expiry; invalidate after profile update |
| `getCurrentSettings` | `GET /api/settings/me` | Query | Medium | `TTL_2M` | Expiry; invalidate after settings update |
| `getLinkedAccounts` | `GET /api/oauth/linked-accounts` | Query | Medium | `TTL_2M` | Expiry; invalidate after unlink/link |
| `getSessions` | `GET /api/sessions` | Query | High/Security | `NO_CACHE` | Always fresh in security screen |
| `updateCurrentUser`, `changeCurrentPassword`, `updateCurrentProfile`, `updateCurrentSettings`, `unlinkLinkedAccount`, `revokeSession` | Mutation endpoints | Mutation | High | `NO_CACHE` | Invalidate relevant read keys on success |
| `fetchAdminUsers` | `GET /api/admin/users` | Query | Medium/High | `TTL_30S` (admin namespace) | Expiry; invalidate after user create/delete/status update |
| `fetchAdminUserProfile` | `GET /api/admin/users/{id}` | Query | Medium/High | `TTL_30S` (admin namespace) | Expiry; invalidate after user update/status |
| `patchAdminUserStatus`, `createAdminStudent`, `deleteAdminUser`, `updateAdminUser` | Admin mutation | Mutation | High | `NO_CACHE` | Invalidate admin users list/detail |

### E. Admin Learning APIs (`src/shared/api/admin-learning.ts`)

| Function | Method/Path | Type | Volatility | Decision | Refresh trigger |
|---|---|---|---|---|---|
| `adminListCourses` | `GET /api/learning/courses` | Query | Medium | `TTL_30S` (admin namespace) | Expiry; invalidate after course CRUD |
| `adminListSections` | `GET /api/learning/courses/{id}/sections` | Query | Medium | `TTL_30S` (admin namespace) | Expiry; invalidate after section/lesson changes |
| `adminListLessons` | `GET /api/learning/sections/{id}/lessons` | Query | High | `TTL_30S` (admin namespace) | Expiry; invalidate after lesson CRUD/status |
| `adminCreateCourse`, `adminUpdateCourse`, `adminDeleteCourse`, `adminCreateLesson`, `adminUpdateLesson`, `adminDeleteLesson`, `adminPatchLessonStatus` | Mutation | Mutation | High | `NO_CACHE` | Invalidate matching admin list/detail keys |

## 2) Refresh and invalidation policy

### Immediate invalidation on mutation success
- Learning:
  - `completeLesson` -> invalidate `learning:progress`, `learning:progress:activity:*`, `learning:streak`.
  - `updateLessonBlockProgress` -> add invalidate `learning:progress`, `learning:progress:activity:*`, `learning:lesson:{id}`.
  - `enrollCourse` -> invalidate enrolled/available/progress and fire `learning:courses-changed`.
- Assessment:
  - `submitAttempt` -> invalidate `assessment:my-attempts`, `assessment:attempt-result:{attemptId}` (if cached).
- Dictionary:
  - Any bookmark/comment/vote/approve/view -> invalidate `dictionary:article:{id}:comments|interactions|views|bookmarks`.
  - Admin article mutations -> invalidate article list/detail keys.
- Auth/Admin users:
  - profile/settings/session/user/admin-user mutations -> invalidate corresponding `auth:*` or `admin:users:*`.

### Revalidation by UX event
- Revalidate on `window focus` for hot data:
  - dashboard widgets (`progress`, `lessonActivity`, `myAttempts`);
  - admin report widgets;
  - auth identity blocks (`/users/me`, `/profiles/me`) if cache older than 30s.

### TTL expiry
- Auto refresh when record expired.
- Keep session-scoped cache binding by user id (existing behavior in `client-cache.ts`).

## 3) Implementation method (code-level)

### New/updated primitives
1. Add cache policy registry in `src/shared/api/cache-policy.ts`.
   - Define `CacheTier` -> ttl + behavior.
   - Define key builders by domain (`learning`, `assessment`, `dictionary`, `auth`, `admin`).
2. Extend `src/shared/api/client-cache.ts`.
   - Add key prefix namespace helpers (`admin:` vs `learner:`).
   - Add wildcard invalidation helper for prefix invalidation.
3. Add helper wrappers in `src/shared/api/http.ts` or new `src/shared/api/cached-request.ts`.
   - `cachedGet(key, policy, factory)`.
   - `mutateAndInvalidate(factory, invalidateKeys)`.

### Rollout order by file
1. `src/shared/api/cache-policy.ts` (new).
2. `src/shared/api/client-cache.ts` (enhance invalidation).
3. `src/shared/api/learning.ts` (align all keys and invalidations, remove caching from `pingStreak`).
4. `src/shared/api/assessment.ts` (assessment key policy alignment).
5. `src/features/encyclopedia/api.ts` (introduce cached GET for read paths only).
6. `src/features/auth/api.ts` (add short cache only for selected GET reads; keep sensitive reads uncached).
7. `src/shared/api/admin-*.ts` modules (admin namespaced caches + mutation invalidations).
8. Consumption points (admin/dashboard/auth screens) for focus-based revalidate hooks.

## 4) Data refresh matrix (when data becomes fresh again)

| Refresh mode | When used | User-visible freshness |
|---|---|---|
| Mutation invalidation | Right after successful write | Immediate next read is fresh |
| TTL expiration | No user action, after tier TTL | Fresh on next request after expiry |
| Focus revalidate | User returns to tab/screen | Fresh shortly after focus |
| Manual retry button | User clicks retry | Forced fresh |
| Session change | Login/logout/profile switch | Old cache isolated and not reused |

## 5) Verification checklist

### Functional correctness
- [ ] After `enrollCourse`, `getEnrolledCourses` and sidebar course list refresh without hard reload.
- [ ] After `completeLesson`, dashboard progress/activity widgets refresh within one interaction.
- [ ] After `updateLessonBlockProgress`, progress/activity no longer stale.
- [ ] After `submitAttempt`, attempt history and result pages show latest values.
- [ ] After dictionary comment/bookmark/vote, interactions and comment tree update correctly.
- [ ] After admin CRUD (courses/users/articles/assessments), list screen and detail screen are consistent.

### Stale-data safety
- [ ] Admin and learner caches do not share same namespace key for same endpoint path.
- [ ] `getSessions` always fetches fresh in security-sensitive screens.
- [ ] Auth session switch invalidates previous user cache scope.

### Concurrency and auth refresh
- [ ] Parallel 401 requests still use existing refresh mutex without duplicate refresh storms.
- [ ] No cached unauthenticated error persists after successful refresh/login.
- [ ] In-flight dedupe (`pendingRequests`) returns one response per key and does not leak across users.

### Performance
- [ ] Repeated dashboard loads within TTL show reduced network calls.
- [ ] No noticeable UI delay caused by over-invalidation.
- [ ] Cache size in `sessionStorage` stays bounded (verify cleanup/invalidation works).
