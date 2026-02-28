# Increment 3 - Auth Wiring (Explained)

## TL;DR

In this increment, we wired anonymous auth into app startup and added a reusable auth state hook:

1. Add `AuthBootstrap` to trigger `ensureAnonymousUser()` on mount.
2. Mount `AuthBootstrap` in root `layout.tsx`.
3. Add `useAuthUser()` hook with `{ user, loading }`.

No game flow yet. No room logic yet.

---

## ELI5 Version

Think of the app like a building that should hand everyone a visitor badge as they enter.

1. `AuthBootstrap` is the front-desk worker at the entrance.
2. Root `layout.tsx` ensures that worker is present on every page.
3. `useAuthUser()` is the status screen that tells us:
   - who currently has a badge (`user`)
   - whether we are still checking (`loading`)

---

## Goal

Wire auth startup once at app root and expose a safe, reusable auth listener hook.

---

## Non-Goals (Intentionally Not Done Yet)

1. No login UI.
2. No Firestore room reads/writes.
3. No Cloud Functions wiring.

---

## Files Changed

1. `src/components/AuthBootstrap.tsx`
2. `src/app/layout.tsx`
3. `src/lib/firebase/use-auth-user.ts`

No dependencies added in this increment.

---

## What Each File Does

## 1) `src/components/AuthBootstrap.tsx`

1. Client component.
2. Calls `ensureAnonymousUser()` in `useEffect` on mount.
3. Renders `null` (side-effect only).

## 2) `src/app/layout.tsx`

1. Imports `AuthBootstrap`.
2. Renders `<AuthBootstrap />` near root body so auth startup runs on every page load.

## 3) `src/lib/firebase/use-auth-user.ts`

1. Client hook using `onAuthStateChanged(auth, ...)`.
2. Returns `{ user, loading }`.
3. Cleans up the subscription on unmount.

---

## Runtime Execution Order (Step by Step)

1. Next renders root layout.
2. `layout.tsx` mounts `<AuthBootstrap />`.
3. `AuthBootstrap` runs `ensureAnonymousUser()` once after mount.
4. Firebase returns existing anonymous user or signs in a new anonymous user.
5. Components using `useAuthUser()` subscribe to auth state.
6. Listener updates `user` and flips `loading` to `false`.

Dependency flow:

`layout.tsx` -> `AuthBootstrap.tsx` -> `ensureAnonymousUser()`  
`use-auth-user.ts` -> `onAuthStateChanged(auth, ...)`

---

## Manual Test Steps

1. Ensure all required Firebase vars are present in `.env.local`.
2. Run:
   - `npm run dev`
3. Open:
   - `http://localhost:3000`
4. In Firebase Console -> Authentication -> Users:
   - confirm anonymous user appears after page load.
5. Refresh once:
   - confirm no auth bootstrap crash.
6. Run:
   - `npm run lint`
7. Expect:
   - lint passes.

---

## Troubleshooting

1. `Missing required Firebase env var`:
   - verify `.env.local` keys
   - check shell for blank `NEXT_PUBLIC_FIREBASE_*` exports overriding local file
2. No anonymous user appears:
   - enable Anonymous sign-in provider in Firebase Auth settings
3. Hook stays loading forever:
   - check browser console/network for Firebase auth initialization errors

---

## TODOs for Next Increment

1. Start Increment 4 type definitions (`Room`, `Player`, `Phase`, `RoundMeta`, etc.) in `src/lib/types.ts`.
2. Add prompt bank in `src/features/guess-the-liar/prompts.ts`.
3. Confirm new types include `publicPrompt` in `RoundMeta` to match architecture updates.
