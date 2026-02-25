# Increment 2 - Firebase Runtime Bootstrap

## Goal

Set up the smallest runtime foundation for Firebase in the frontend:

1. Install the Firebase Web SDK (approved dependency).
2. Add a Firebase client singleton.
3. Add an anonymous auth helper.

No UI wiring yet.
No game logic yet.

---

## Starting Point

From Increment 1, we already had environment validation in:

- `src/lib/firebase/config.ts`

That file exposes `getFirebaseWebConfig()` and throws if required env vars are missing.

---

## What Changed

## 1) Dependency Installation

Files changed:

- `package.json`
- `package-lock.json`

What changed:

1. Added `firebase` dependency to `package.json`.
2. Updated lockfile for deterministic installs.

Why:

`firebase/app`, `firebase/auth`, and `firebase/firestore` imports require the official SDK package.

---

## 2) Firebase Client Singleton

File changed:

- `src/lib/firebase/client.ts`

What this file does:

1. Imports Firebase SDK modules:
   - `initializeApp`, `getApps`, `getApp`
   - `getAuth`
   - `getFirestore`
2. Pulls validated config from Increment 1 via `getFirebaseWebConfig()`.
3. Initializes app exactly once (singleton pattern):
   - reuse existing app if already initialized
   - otherwise initialize new app
4. Exports:
   - `firebaseApp`
   - `auth`
   - `db`
5. Adds TODO for future Functions client wiring.

Why singleton matters:

If app init runs multiple times in hot reload or multi-module imports, Firebase throws duplicate-app errors.
Using `getApps().length > 0 ? getApp() : initializeApp(...)` prevents that.

---

## 3) Anonymous Auth Helper

File changed:

- `src/lib/firebase/auth.ts`

What this file does:

1. Imports `signInAnonymously`.
2. Reuses exported `auth` from `client.ts`.
3. Exposes `ensureAnonymousUser()`:
   - returns current user if already signed in
   - otherwise performs anonymous sign-in and returns created user
4. Adds TODO for a future auth listener utility.

Why this helper exists:

We want auth call sites to stay simple and consistent.
Instead of repeating sign-in logic in pages/components, they can call one function.

---

## Execution Order (Runtime)

When a future component calls `ensureAnonymousUser()`:

1. `auth.ts` imports `auth` from `client.ts`.
2. `client.ts` evaluates:
   - gets config from `getFirebaseWebConfig()` (Increment 1)
   - initializes/reuses Firebase app singleton
   - creates `auth` + `db` instances
3. `ensureAnonymousUser()` runs:
   - returns existing `auth.currentUser` OR
   - calls `signInAnonymously(auth)` and returns credential user.

So the runtime chain is:

`config.ts` -> `client.ts` -> `auth.ts`

---

## Manual Test Steps (Exact)

## A) Dependency check

1. Run:
   - `npm ls firebase`
2. Expected:
   - prints installed `firebase` version
   - no "missing" errors

## B) Static checks

1. Run:
   - `npm run lint`
2. Expected:
   - lint passes with no errors

## C) Basic runtime sanity

1. Run:
   - `npm run dev`
2. Open:
   - `http://localhost:3000`
3. Expected:
   - app compiles and loads
   - no Firebase import/compile crashes

Note:

There is no visible auth behavior yet in UI because `ensureAnonymousUser()` is not wired to a component in this increment.

---

## What To Read First

Read in this exact order:

1. `src/lib/firebase/config.ts`
2. `src/lib/firebase/client.ts`
3. `src/lib/firebase/auth.ts`

This order matches how execution flows at runtime.

---

## Design Decisions

1. Keep increment small and reversible.
2. Keep logic runtime-safe before UI integration.
3. Add TODO markers where follow-up work is expected.
4. Avoid adding extra abstractions until first caller is implemented.

---

## TODOs for Next Increments

1. TODO: Wire `ensureAnonymousUser()` into app boot (likely via client bootstrap component).
2. TODO: Add `useAuthUser` hook for reactive auth state in React.
3. TODO: Add Firebase Functions client only when callable functions are introduced.
4. TODO: Add Firestore subscription helper only when a first room document shape is defined.

---

## SWE Takeaways

1. Separate config validation from runtime initialization.
2. Introduce one responsibility per file:
   - config
   - runtime clients
   - auth helper
3. Validate early with lint to keep small increments reliable.
4. Treat dependency additions as explicit design decisions with approval.
