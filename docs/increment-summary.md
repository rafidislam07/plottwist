# PlotTwist Combined Progress Summary (So Far)

## TL;DR

We now have five completed increments in sequence:

1. Increment 1: fail-fast Firebase env config.
2. Increment 2: Firebase runtime bootstrap (`app`, `auth`, `db`) + anonymous auth helper.
3. Increment 3: app-level auth wiring (`AuthBootstrap`) + `useAuthUser()` hook.
4. Increment 4: canonical game data types + initial prompt bank.
5. Increment 5: local-only Firebase emulator foundation (Auth/Firestore/Functions) with client emulator routing.

---

## ELI5

Think of building a party-game clubhouse:

1. Increment 1 put a checklist at the door so missing keys are caught immediately.
2. Increment 2 installed the core lock/auth/database system.
3. Increment 3 put a receptionist at the entrance so every visitor gets a guest badge.
4. Increment 4 wrote the official rulebook and prepared question cards.
5. Increment 5 built a full practice city (`demo-plottwist`) so all testing stays local and never accidentally hits the real city.

---

## What We Did (Chronological)

## 0) Documentation foundation work

1. Tightened architecture/roadmap docs and kept them as execution source of truth.
2. Captured a Next.js env-var lesson for client-safe env access.

## 1) Increment 1 - Config Foundation

Primary file:

- `src/lib/firebase/config.ts`

Implemented:

1. Required Firebase env key typing.
2. Fail-fast env validation with explicit missing-key errors.
3. Centralized `getFirebaseWebConfig()` output.

Outcome:

- App fails early and clearly when required Firebase config is missing.

## 2) Increment 2 - Runtime Bootstrap

Primary files:

- `src/lib/firebase/client.ts`
- `src/lib/firebase/auth.ts`
- dependency update in `package.json` / `package-lock.json`

Implemented:

1. Singleton Firebase app init.
2. Shared runtime exports (`firebaseApp`, `auth`, `db`).
3. `ensureAnonymousUser()` helper.

Outcome:

- Reliable Firebase runtime baseline with no duplicate-init behavior.

## 3) Increment 3 - Auth Wiring

Primary files:

- `src/components/AuthBootstrap.tsx`
- `src/app/layout.tsx`
- `src/lib/firebase/use-auth-user.ts`

Implemented:

1. App-root anonymous auth bootstrap on mount.
2. Reusable auth-state hook returning `{ user, loading }`.

Outcome:

- Global auth startup is wired and stable for future game pages.

## 4) Increment 4 - Types + Prompt Bank

Primary files:

- `src/lib/types.ts`
- `src/features/guess-the-liar/prompts.ts`

Implemented:

1. Canonical room/player/round/answer/vote types.
2. Round-scoped ID support and reveal-phase-compatible fields.
3. Starter prompt bank for Guess-the-Liar.

Outcome:

- Shared data contracts now exist for upcoming Functions + room flow work.

## 5) Increment 5 - Firebase Local Emulator Foundation

Primary files:

- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `functions/package.json`
- `functions/index.js`
- `functions/package-lock.json`
- `src/lib/firebase/client.ts`
- `.env.local` (local env)

Implemented:

1. Fixed Functions runtime detection by adding valid Functions package metadata + entrypoint.
2. Added explicit Firestore rules file mapping.
3. Switched Firebase CLI project target to `demo-plottwist` for local-only mode.
4. Updated local Firebase env values to match demo project.
5. Added automatic Auth/Firestore emulator connection in client runtime for dev/demo mode.
6. Installed/updated `firebase-functions` and `firebase-admin` in `functions/`.

Outcome:

- `firebase emulators:start --only auth,firestore,functions` now starts with Functions definitions loaded.
- App traffic can be kept on local emulators instead of real Firebase.

---

## End-to-End Execution Order (Current State)

1. `layout.tsx` renders app shell and mounts auth bootstrap.
2. Firebase singleton reads validated web config.
3. In dev/demo mode, client connects to local Auth + Firestore emulators.
4. Anonymous user bootstrap runs.
5. `useAuthUser()` listeners receive and expose auth state.
6. Shared game types/prompt bank are available for upcoming room/game logic.

---

## Current Verification Checklist

1. `npm run lint` -> expect no errors.
2. `cd functions && npm install` -> ensure Functions deps exist.
3. `firebase emulators:start --only auth,firestore,functions` -> expect Functions definitions to load.
4. `npm run dev` -> app boots without Firebase config/runtime errors.
5. Emulator UI (`http://127.0.0.1:4000`) shows local auth/firestore activity.

---

## Open TODOs

1. Increment 6: implement `createRoom` + `joinRoom` callable Functions.
2. Increment 6: wire create/join pages to callable backend.
3. Replace permissive local `firestore.rules` with scoped rules as room data model lands.
4. Keep architecture/roadmap/increment docs synchronized with each merge.
