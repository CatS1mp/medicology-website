# Medicology Website — Framework & Architecture

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | **Next.js** (App Router) | 16.1.4 |
| UI Library | **React** | 19.2.3 |
| Language | **TypeScript** | ^5 |
| Styling | **Tailwind CSS v4** | ^4 |
| Linting | **ESLint** (Next.js preset) | ^9 |
| Package Manager | **npm** | — |

> No external component libraries or state management packages. All UI is custom-built.

---

## Project Structure

```
medicology-website/
├── public/                   # Static assets (images, icons, SVGs)
│   └── images/
│       ├── Logo/
│       └── Mascot/
├── src/
│   ├── app/                  # Next.js App Router (routing only)
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Root redirect
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── dashboard/
│   ├── features/             # Feature modules (domain logic)
│   │   ├── auth/             # Login, Signup, Forgot Password
│   │   ├── dashboard/        # Dashboard, Charts, Sidebar, Banner
│   │   └── homepage/
│   └── shared/               # Reusable across 2+ features
│       └── components/
├── FRONTEND_GUIDELINES.md
├── next.config.ts
├── tailwind.config.ts        # (implicit via PostCSS)
├── tsconfig.json
└── package.json
```

---

## Architecture Pattern

### Feature-based + Component-based

Each feature is a **self-contained module**:

```
features/<name>/
├── components/    # UI components (render only)
├── hooks/         # Custom hooks
├── utils/         # Helpers
├── types/         # TypeScript interfaces/types
├── api.ts         # API calls for this feature
└── index.ts       # Public exports
```

**Rules:**
- `app/` — routing and page wiring only, no business logic
- `features/` — all domain logic; features must not cross-import each other
- `shared/` — only code used by 2+ features; no imports back into `features/`

---

## Routing

Uses **Next.js App Router** (`/app` directory). Each route folder holds a `page.tsx` that mounts the feature's Screen component.

| URL | Page file | Feature Screen |
|---|---|---|
| `/` | `app/page.tsx` | Redirects to `/login` |
| `/login` | `app/login/page.tsx` | `auth/LoginScreen` |
| `/signup` | `app/signup/page.tsx` | `auth/SignupScreen` |
| `/forgot-password` | `app/forgot-password/page.tsx` | `auth/ForgotPasswordScreen` |
| `/dashboard` | `app/dashboard/page.tsx` | `dashboard/DashboardScreen` |

---

## Styling

- **Tailwind CSS v4** via PostCSS (`@tailwindcss/postcss`)
- Global styles in `src/app/globals.css` (CSS variables, keyframe animations)
- Component-level inline styles used where Tailwind conflicts with precise layout control (e.g. the Hero Banner mascot)
- No separate CSS modules per component

---

## State Management

| State type | Tool |
|---|---|
| Local UI state | `React.useState` |
| Server/API state | *(TanStack Query — planned)* |
| Global (auth, theme) | *(Context / Zustand — planned)* |

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component | PascalCase | `HeroBanner.tsx` |
| Screen | PascalCase + `Screen` suffix | `DashboardScreen.tsx` |
| Hook | `use` prefix | `useAuth.ts` |
| Function | camelCase | `fetchUserData` |
| Boolean | `is / has / can` prefix | `isLoggedIn` |
| File | PascalCase (components) or camelCase | `api.ts` |

---

## Key Conventions

- **Components** only render UI; no direct API calls
- **Screens** orchestrate: call APIs, manage state, wire up components
- API calls live in each feature's `api.ts`, never inline in components
- No cross-feature imports — shared code goes to `shared/`
- TypeScript strict mode enabled

---

## Scripts

```bash
npm run dev     # Start dev server (localhost:3000)
npm run build   # Production build
npm run start   # Serve production build
npm run lint    # Run ESLint
```
