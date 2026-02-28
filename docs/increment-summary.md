# PlotTwist Combined Progress Summary (So Far)

## TL;DR

We moved from project setup and architecture cleanup into three concrete Firebase/auth increments:

1. Increment 1: fail-fast Firebase env config.
2. Increment 2: Firebase runtime bootstrap (`app`, `auth`, `db`) + `ensureAnonymousUser()`.
3. Increment 3: app-level auth wiring (`AuthBootstrap`) + `useAuthUser()` hook.

We also documented a key Next.js env-var lesson (static vs dynamic env access in client-reachable code).

---

## ELI5

Think of building a party-game app like opening a clubhouse:

1. Increment 1 put a checklist on the door: "Do we have all required keys?"  
2. Increment 2 installed the lock system and a guest-pass machine.  
3. Increment 3 placed a staff member at the entrance so every visitor gets a pass automatically, and a status board to show who is signed in.  
4. The lesson learned: when printing instructions for the browser, you must use exact env names, not "look up by variable name" tricks.

---

## What We Did (Chronological)

## 0) Documentation foundation work

1. Improved architecture docs structure and roadmap clarity.
2. Added/updated game-flow details (including reveal-phase clarification work in progress).
3. Kept architecture/roadmap as the source of truth for incremental execution.

## 1) Increment 1 - Config Foundation

Primary file:

- `src/lib/firebase/config.ts`

Implemented:

1. Required Firebase env key typing.
2. Fail-fast `getRequiredEnv(...)` validation.
3. `getFirebaseWebConfig()` for centralized web config output.

Outcome:

- Missing required key throws immediately with explicit key name.

## 2) Increment 2 - Runtime Bootstrap

Primary files:

- `src/lib/firebase/client.ts`
- `src/lib/firebase/auth.ts`
- dependency update in `package.json` / `package-lock.json`

Implemented:

1. Singleton Firebase app init (`getApp/getApps/initializeApp`).
2. Shared exports: `firebaseApp`, `auth`, `db`.
3. `ensureAnonymousUser()` helper for low-friction anonymous auth.

Outcome:

- Reusable runtime Firebase baseline without duplicate init behavior.

## 3) Increment 3 - Auth Wiring

Primary files:

- `src/components/AuthBootstrap.tsx`
- `src/app/layout.tsx`
- `src/lib/firebase/use-auth-user.ts`

Implemented:

1. `AuthBootstrap` triggers `ensureAnonymousUser()` on app mount.
2. Root layout mounts `AuthBootstrap`, so auth bootstraps on every page load.
3. `useAuthUser()` subscribes to `onAuthStateChanged` and returns `{ user, loading }`.

Outcome:

- Auth startup is wired globally and ready for future room/game pages.

## 4) Lesson captured - Next.js env vars

Primary file:

- `docs/lessons/nextjs-env-vars.md`

Key learning:

1. In client-reachable code, dynamic access (`process.env[key]`) can fail bundler inlining.
2. Use static `process.env.NEXT_PUBLIC_*` references for client-side env usage.
3. If env errors persist, check shell-exported empty vars overriding `.env.local`.

---

## End-to-End Execution Order (Current State)

1. `layout.tsx` renders app shell.
2. `AuthBootstrap` mounts and calls `ensureAnonymousUser()`.
3. `ensureAnonymousUser()` uses shared `auth` from Firebase client singleton.
4. Firebase client singleton pulls validated config from `getFirebaseWebConfig()`.
5. `useAuthUser()` listeners receive auth updates and expose `{ user, loading }`.

---

## Manual Verification Checklist

1. `npm run lint` -> expect no errors.
2. `npm ls firebase` -> expect installed dependency.
3. `npm run dev` -> app starts without Firebase config crash.
4. Firebase Console -> Authentication -> Users -> anonymous user appears after first page load.
5. Refresh app -> no duplicate-init/auth bootstrap crash.

---

## Open TODOs

1. Increment 4: add canonical game types in `src/lib/types.ts`.
2. Increment 4: add prompt bank in `src/features/guess-the-liar/prompts.ts`.
3. Keep architecture + roadmap synced with actual code and incremental docs.
4. Decide whether to merge architecture/roadmap pending edits as a separate docs-only commit.
