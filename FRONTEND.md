# Frontend Codebase Analysis — Rotom Mobile App

**Location:** `apps/mobile`  
**Last analyzed:** March 2025

---

## 1. Overview

The Rotom frontend is a **cross-platform mobile app** (iOS, Android, Web) built with **Expo** and **React Native**. It serves as the user-facing client for the Rotom system (community/organization management), providing login via WhatsApp OTP, community fund viewing, gallery (placeholder), and profile (placeholder). It is designed to talk to the NestJS backend over HTTP (oRPC + Better Auth); currently **no API client is wired** and screens use mock data or mock verification.

---

## 2. Technology Stack

| Category        | Technology |
|----------------|------------|
| **Framework**  | Expo ~54, React 19.1, React Native 0.81 |
| **Routing**    | expo-router 6 (file-based, typed routes) |
| **Styling**    | Uniwind 1.2 (Tailwind-style), Tailwind CSS 4, tw-animate-css |
| **UI primitives** | @rn-primitives (accordion, dialog, tabs, etc.), class-variance-authority (cva), clsx, tailwind-merge |
| **Icons**      | lucide-react-native |
| **Navigation** | @react-navigation/native 7, react-native-screens, react-native-safe-area-context |
| **Animation**  | react-native-reanimated, react-native-gesture-handler |
| **Keyboard**  | react-native-keyboard-controller |
| **Web**        | react-native-web, static output via `expo start --web` |

The app uses **strict TypeScript** and the **new React Native architecture** (`newArchEnabled: true` in app.json).

---

## 3. Project Structure

```
apps/mobile/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout (theme, Stack, PortalHost)
│   ├── index.tsx           # Landing / welcome screen
│   ├── +not-found.tsx       # 404 screen
│   ├── +html.tsx           # Web-only HTML shell (static export)
│   ├── (tabs)/             # Tab group: Home, Funds, Gallery, Profile
│   │   ├── _layout.tsx     # Tab bar configuration
│   │   ├── index.tsx       # Home tab
│   │   ├── funds.tsx       # Funds tab
│   │   ├── gallery.tsx     # Gallery (placeholder)
│   │   └── profile.tsx     # Profile (placeholder)
│   ├── auth/
│   │   ├── login.tsx       # Phone number input → OTP flow
│   │   └── otp.tsx         # 6-digit OTP input, timer, verify → /home
│   ├── funds/
│   │   └── index.tsx       # Standalone “Community Fund” (from landing CTA)
│   └── home/
│       └── index.tsx       # Post-login home (currently minimal)
├── components/
│   └── ui/                 # Shared UI
│       ├── button.tsx      # CVA-based Button (Pressable)
│       ├── text.tsx        # Text + TextClassContext, variants
│       └── icon.tsx        # Lucide wrapper with Uniwind (withUniwind)
├── lib/
│   ├── theme.ts            # THEME (light/dark tokens), NAV_THEME for React Navigation
│   └── utils.ts            # cn() (clsx + tailwind-merge)
├── navigator/
│   └── MainNavigator.tsx   # Stub (empty export), not used in routing
├── global.css              # Tailwind + Uniwind + @theme (design tokens)
├── app.json                # Expo config (scheme, splash, plugins, experiments.typedRoutes)
├── components.json         # shadcn-style config (aliases, tailwind, baseColor)
├── api-1(1).json           # OpenAPI 3.1 spec (backend reference, not used by code)
└── package.json
```

---

## 4. Routing and Navigation

- **Router:** expo-router with **typed routes** (`experiments.typedRoutes`).
- **Root:** Single `Stack` in `_layout.tsx`; no explicit stack groups elsewhere.
- **Tabs:** `(tabs)` group provides bottom tabs: **Home**, **Funds**, **Gallery**, **Profile** (icons: Home, Wallet, Image, User).
- **Key routes:**
  - `/` → Landing (welcome, logo, “Login with WhatsApp”, “View Community Fund”).
  - `/auth/login` → Phone input (+62), then navigate to `/auth/otp?phone=...`.
  - `/auth/otp` → 6-digit OTP, 30s resend timer; on verify → `router.replace('/home')`.
  - `/home` → `app/home/index.tsx` (post-login home; currently almost empty).
  - `/funds` → `app/funds/index.tsx` (standalone Community Fund screen with back button; used from landing CTA).
  - `/(tabs)/*` → Tab screens; `/(tabs)/funds` is the in-tab version of the fund screen.

**Navigation patterns:** `router.push()`, `router.replace()`, `router.back()`; `useLocalSearchParams()` for OTP phone. No deep linking or auth guards are implemented in the analyzed code.

---

## 5. Screens and Features

| Screen        | Route / Location      | Status | Notes |
|---------------|------------------------|--------|--------|
| **Landing**   | `app/index.tsx`        | Done   | Logo, welcome text, Login CTA, View Community Fund CTA. Theme toggle present in code but not rendered in the snippet. |
| **Login**     | `app/auth/login.tsx`   | Done   | +62 prefix, phone input, “Next” → `/auth/otp` with `phone` param. No backend call. |
| **OTP**       | `app/auth/otp.tsx`     | Mock  | 6 inputs, 30s countdown, Resend (resets timer only). Verify calls `router.replace('/home')`; no real Better Auth / API. |
| **Home (tab)**| `app/(tabs)/index.tsx` | Stub  | SafeAreaView + empty View. |
| **Home (post-login)** | `app/home/index.tsx` | Stub  | Exports `HomeScreen` with empty fragment. |
| **Funds (tab)**       | `app/(tabs)/funds.tsx` | Done  | Total balance card, Contribute / History buttons, “Recent Activities” list with mock contributions (IDR, dates, notes). |
| **Funds (standalone)**| `app/funds/index.tsx`  | Done  | Same content as tab funds but with back button and no tab bar. |
| **Gallery**   | `app/(tabs)/gallery.tsx` | Placeholder | “Gallery Coming Soon”. |
| **Profile**   | `app/(tabs)/profile.tsx` | Placeholder | “Profile Coming Soon”. |
| **404**       | `app/+not-found.tsx`   | Done   | “This screen doesn’t exist” + Link to home. |

Funds screens share the same mock data and helpers: `formatCurrency(id-ID)`, `formatDate(id-ID)`, and a fixed list of contributions. No pagination or “See All” implementation.

---

## 6. UI Components and Theming

### 6.1 Design tokens

- **global.css:** Imports `tailwindcss`, `uniwind`, `tw-animate-css`. Defines `@theme` with `--radius*` and `--spacing-hairline`. Light/dark variants set semantic colors: `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-*`, `sidebar-*` (oklch).
- **lib/theme.ts:** Exports `THEME` (light/dark) with HSL values and `NAV_THEME` (React Navigation `Theme` with `colors.background`, `border`, `card`, `notification`, `primary`, `text`). Used by root `ThemeProvider` and tabs `_layout` for `tabBarActiveTintColor`, `tabBarInactiveTintColor`, `tabBarStyle`, etc.

### 6.2 Components

- **Button** (`components/ui/button.tsx`): Built from `Pressable` and **CVA** (`buttonVariants`, `buttonTextVariants`). Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default`, `sm`, `lg`, `icon`. Uses `TextClassContext` so child text gets the right variant. Web: focus ring, hover, aria-invalid, disabled pointer-events.
- **Text** (`components/ui/text.tsx`): Wraps RN `Text` (or `Slot.Text` when `asChild`). **CVA** variants: `default`, `h1`–`h4`, `p`, `blockquote`, `code`, `lead`, `large`, `small`, `muted`. Supports `role` and `aria-level` for headings/code/blockquote. Can inherit button text style via `TextClassContext`.
- **Icon** (`components/ui/icon.tsx`): Wraps Lucide icons via `as` prop; uses `withUniwind` so `className` (e.g. `text-*`, `size-*`) maps to style. Defaults: `text-foreground size-5`.

### 6.3 Theming behavior

- **Uniwind** is used for `className`-based styling across the app; root layout uses `useUniwind().theme` for `StatusBar` and `ThemeProvider` (NAV_THEME).
- **ThemeProvider** from `@react-navigation/native` wraps the app so tab bar and navigation use light/dark tokens. Theme can be toggled (e.g. `Uniwind.setTheme`) in the landing screen code.

---

## 7. State and Data

- **No global state library:** No Redux, Zustand, or React Query in the tree; local `useState` / `useRef` only.
- **Auth:** Login and OTP are UI-only. No session persistence, no Better Auth client calls, no protected route checks. OTP “verify” is a mock that navigates to `/home`.
- **Funds:** All data is in-screen mock objects (`MOCK_FUND`, `MOCK_CONTRIBUTIONS`) shaped to match the backend API (contributor, reporter, amount, note, currency, createdAt). No fetch, no oRPC.
- **API spec:** `api-1(1).json` is an OpenAPI 3.1 export of the backend; it is not referenced by any frontend code (no generated client or runtime usage).

---

## 8. Integration Points (Planned vs Current)

| Area           | Intended (from SDD)        | Current state |
|----------------|----------------------------|---------------|
| **Auth**       | Better Auth, OTP via WhatsApp | Login/OTP UI only; verify is mock, no session |
| **API**        | oRPC + Better Auth session  | No client; no calls to backend |
| **Funds**      | Backend fund + contributions | Mock data in two funds screens |
| **Gallery**    | Backend + MinIO media       | Placeholder screen |
| **Profile**    | Backend profile             | Placeholder screen |

---

## 9. Dependencies Summary

- **Expo / RN:** expo, expo-router, expo-constants, expo-splash-screen, expo-status-bar, expo-system-ui, expo-updates, expo-linking, expo-haptics.
- **Navigation:** @react-navigation/native, react-native-screens, react-native-safe-area-context.
- **UI / styling:** uniwind, tailwindcss, tailwindcss-animate, tw-animate-css, class-variance-authority, clsx, tailwind-merge, @rn-primitives/*.
- **Icons / assets:** lucide-react-native.
- **Native behavior:** react-native-reanimated, react-native-gesture-handler, react-native-keyboard-controller, react-native-svg, react-native-web.

---

## 10. Recommendations

1. **API / auth client:** Add an oRPC client (or fetch wrapper) and Better Auth client; point login/OTP to real endpoints and persist session; add a small auth context or guard for protected routes.
2. **Funds:** Replace mock data with API calls (e.g. get fund summary + contributions list); consider a single funds screen with different entry points (tab vs deep link) instead of duplicating UI in `(tabs)/funds` and `funds/index`.
3. **Post-login home:** Define what `/home` should show (e.g. dashboard, quick actions) and implement; optionally redirect authenticated users from `/` to `/home` or `/(tabs)`.
4. **Gallery & profile:** Implement when backend and MinIO are ready; reuse design tokens and existing UI components.
5. **MainNavigator:** Either remove the unused `navigator/MainNavigator.tsx` stub or use it for a custom navigator if needed.
6. **OpenAPI file:** Remove or rename `api-1(1).json`; if kept for reference, consider generating a type-safe client or documenting that it’s for humans only.

This document reflects the state of `apps/mobile` as of the analysis date; implementation details may change as the app is connected to the backend and auth.
