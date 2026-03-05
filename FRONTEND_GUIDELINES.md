# FRONTEND CODING RULES

## 1. Nguyên tắc chung
- Frontend chỉ xử lý hiển thị và tương tác
- Không đặt business logic phức tạp ở UI
- Không suy đoán logic backend
- Mọi giao tiếp với backend phải thông qua API contract

## 2. Kiến trúc tổng thể
- Sử dụng Component-based + Feature-based architecture
- Routing sử dụng Next.js App Router
- Mỗi feature là một module độc lập về mặt logic

## 3. Cấu trúc thư mục
```
src/
 ├── app/                 // routing, layout, page
 ├── features/            // domain / feature modules
 ├── shared/              // dùng chung toàn app
 └── styles/
```
**Quy định:**
- `app/` chỉ chứa routing và screen
- `features/` chứa logic nghiệp vụ
- `shared/` chỉ chứa code dùng cho từ 2 feature trở lên
- Không import ngược từ `shared` vào `features`

## 4. Cấu trúc bên trong feature
Mỗi feature được phép có cấu trúc giống shared nhưng phạm vi cục bộ:
```
features/course/
 ├── components/
 ├── hooks/
 ├── utils/
 ├── types/
 ├── api.ts
 └── index.ts
```
**Quy định:**
- Code trong feature chỉ được dùng trong feature đó
- Không import chéo giữa các feature
- Nếu code cần dùng cho nhiều feature → chuyển lên `shared`

## 5. Component & Screen
- Component chỉ làm nhiệm vụ render UI
- Screen chịu trách nhiệm:
  - Gọi API
  - Điều phối state
  - Kết nối component

**Quy ước:**
- Component: `PascalCase`
- Screen: `SomethingScreen.tsx`
- Một component chỉ nên có một trách nhiệm rõ ràng

## 6. State management
- Local UI state: `useState`
- API state: React Query / TanStack Query
- Global state: chỉ dùng cho auth, theme, locale

Không đưa toàn bộ state vào global store.

## 7. Naming convention
- Component: `PascalCase`
- Hook: `useSomething`
- Function: `camelCase`
- Boolean: `isX`, `hasX`, `canX`
- File: `kebab-case` hoặc `camelCase`

## 8. API & Data handling
- Không gọi API trực tiếp trong component UI
- Mỗi feature có file `api.ts` riêng
- Không hard-code endpoint trong component

## 9. Tooling bắt buộc
- ESLint (Next.js preset)
- Prettier
- Husky + lint-staged
- TypeScript strict mode

## 10. Quy tắc cấm
- Không import chéo feature
- Không để logic nghiệp vụ trong UI component
- Không parse message lỗi từ backend, chỉ dùng error code
