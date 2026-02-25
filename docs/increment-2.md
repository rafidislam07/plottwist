# Increment 2 - Firebase Runtime Bootstrap (Explained)

## TL;DR

In this increment, we connected the app to Firebase at runtime with a safe baseline:

1. Install Firebase SDK.
2. Create one shared Firebase client (`app`, `auth`, `db`).
3. Add `ensureAnonymousUser()` helper so auth call sites stay simple.

No UI wiring yet. No game logic yet.

---

## ELI5 Version

Imagine your app is a new school building:

1. `config.ts` is the address card: it says where the school is.
2. `client.ts` is unlocking the front door once:
   - if door is already unlocked, do not unlock again
   - if locked, unlock it
3. `auth.ts` is the "guest pass" desk:
   - if visitor already has a pass, let them in
   - if not, give anonymous pass

Why this matters:
if we try to unlock the same door again and again, Firebase can throw duplicate-app errors.

---

## Goal

Set the smallest runtime Firebase foundation in the frontend:

1. Add official Firebase SDK dependency.
2. Initialize Firebase app once (singleton).
3. Expose ready-to-use `auth` and `db`.
4. Add a single helper to ensure anonymous auth.

---

## Non-Goals (Intentionally Not Done Yet)

1. No UI auth flow.
2. No Firestore reads/writes from pages/components.
3. No Cloud Functions wiring in this increment.

---

## Starting Point from Increment 1

We already had env validation in:

- `src/lib/firebase/config.ts`

That file provides `getFirebaseWebConfig()` and throws early if required env vars are missing.

---

## What Changed

## 1) Dependency Installation

Files changed:

- `package.json`
- `package-lock.json`

What changed:

1. Added `firebase` package.
2. Lockfile updated for reproducible installs.

Why:
we need official SDK modules for runtime clients:
`firebase/app`, `firebase/auth`, `firebase/firestore`.

---

## 2) Firebase Client Singleton

File changed:

- `src/lib/firebase/client.ts`

What this file does:

1. Imports Firebase init and service constructors.
2. Reads validated config from `getFirebaseWebConfig()`.
3. Initializes app exactly once:
   - `getApp()` if already initialized
   - `initializeApp()` if not
4. Exports:
   - `firebaseApp`
   - `auth`
   - `db`
5. Includes TODO marker for future Functions client.

Why this design:
in Next.js dev mode with hot reload, modules can re-run. Singleton init prevents duplicate Firebase app creation.

---

## 3) Anonymous Auth Helper

File changed:

- `src/lib/firebase/auth.ts`

What this file does:

1. Imports `signInAnonymously`.
2. Reuses shared `auth` instance from `client.ts`.
3. Exposes `ensureAnonymousUser()`:
   - returns `auth.currentUser` if already signed in
   - otherwise signs in anonymously and returns created user
4. Adds TODO marker for future auth listener helper.

Why this helper exists:
without it, each caller would duplicate "if user exists, else sign in" logic. One helper keeps behavior consistent.

---

## Runtime Execution Order (Step by Step)

When some future component calls `ensureAnonymousUser()`:

1. `auth.ts` loads and imports `auth` from `client.ts`.
2. `client.ts` runs:
   - pulls config from `config.ts`
   - initializes or reuses Firebase app
   - creates `auth` and `db`
3. `ensureAnonymousUser()` checks `auth.currentUser`:
   - user exists: return immediately
   - user missing: call `signInAnonymously(auth)`, return new user

Dependency chain:

`config.ts` -> `client.ts` -> `auth.ts`

---

## Mental Model (Quick)

1. `config.ts` = "Do we have valid keys?"
2. `client.ts` = "Create shared Firebase runtime clients once."
3. `auth.ts` = "Guarantee we have a signed-in user (anonymous for now)."

---

## Manual Test Steps

## A) Confirm dependency

1. Run: `npm ls firebase`
2. Expect:
   - installed `firebase` version shown
   - no missing dependency errors

## B) Lint check

1. Run: `npm run lint`
2. Expect:
   - lint passes

## C) Dev runtime sanity

1. Run: `npm run dev`
2. Open: `http://localhost:3000`
3. Expect:
   - app compiles and loads
   - no Firebase import/init crash

Note:
no visible auth behavior in UI yet, because `ensureAnonymousUser()` is not wired to a component in this increment.

---

## Troubleshooting

1. Error about missing Firebase env vars:
   - check `.env.local` keys from Increment 1
2. Duplicate Firebase app error:
   - verify singleton pattern in `client.ts`
3. Anonymous auth fails:
   - verify Anonymous provider is enabled in Firebase Console Auth settings

---

## What To Read First

Read in this order:

1. `src/lib/firebase/config.ts`
2. `src/lib/firebase/client.ts`
3. `src/lib/firebase/auth.ts`

This matches runtime execution order.

---

## Design Decisions

1. Keep increment small and reversible.
2. Build runtime safety before UI integration.
3. Keep responsibilities separated per file.
4. Add TODOs only where follow-up is expected.

---

## TODOs for Next Increments

1. Wire `ensureAnonymousUser()` into app bootstrap (client-side entry).
2. Add reactive auth state helper (`useAuthUser` or similar).
3. Add Firebase Functions client only when first callable function is introduced.
4. Add Firestore subscription helper only after first room document shape is defined.

---

## SWE Takeaways

1. Validate config early; initialize runtime once.
2. Small helpers reduce duplication and edge-case drift.
3. Keep increments narrow so rollback and review stay easy.
