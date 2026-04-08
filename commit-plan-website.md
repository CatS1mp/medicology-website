# Commit Plan - Medicology Website

## Scope
- API foundation: shared HTTP transport + Spring ApiResponse unwrapping
- Assessment proxy route and typed clients
- Dashboard data replacement and missing screens (lesson, attempt, result, notifications gap)

## Commits
1. feat(api): add shared transport and response unwrapping strategy
2. feat(proxy): add assessment proxy and typed assessment client
3. feat(integration): wire auth/profile/dictionary/learning real clients
4. feat(routes): add lesson, attempt, attempt-result, notifications-gap routes
5. refactor(dashboard): replace supported mock widgets with backend data
6. docs(integration): update integration matrix and known remaining gaps

## Verification
- Website handles both plain JSON and ApiResponse envelope
- No sidebar navigation points to missing route
- Remaining unsupported widgets are documented clearly
