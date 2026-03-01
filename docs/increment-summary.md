# PlotTwist Combined Progress Summary (So Far)

## TL;DR

We now have six completed increments in sequence:

1. Increment 1: fail-fast Firebase env config.
2. Increment 2: Firebase runtime bootstrap (`app`, `auth`, `db`) + anonymous auth helper.
3. Increment 3: app-level auth wiring (`AuthBootstrap`) + `useAuthUser()` hook.
4. Increment 4: canonical game data types + initial prompt bank.
5. Increment 5: local-only Firebase emulator foundation (Auth/Firestore/Functions) with client emulator routing.
6. Increment 6: create/join full-stack flow with callable Functions, route wiring, and local rules alignment.

---

## ELI5

Think of building a party-game clubhouse:

1. Increment 1 put a checklist at the door so missing keys are caught immediately.
2. Increment 2 installed the core lock/auth/database system.
3. Increment 3 put a receptionist at the entrance so every visitor gets a guest badge.
4. Increment 4 wrote the official rulebook and prepared question cards.
5. Increment 5 built a full practice city (`demo-plottwist`) so all testing stays local and never accidentally hits the real city.
6. Increment 6 added two working front doors (create and join) that talk to a backend doorman and send players into a room page.

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

## 6) Increment 6 - Create + Join (Full Stack)

Primary files:

- `functions/index.js`
- `firestore.rules`
- `src/lib/firebase/client.ts`
- `src/app/games/guess-the-liar/create/page.tsx`
- `src/app/games/guess-the-liar/join/page.tsx`
- `src/app/games/guess-the-liar/room/[roomCode]/page.tsx`
- `src/app/page.tsx`

Implemented:

1. Callable `createRoom` and `joinRoom` backend handlers.
2. Input/auth/phase/capacity validation + transaction-based writes.
3. Idempotent duplicate join behavior.
4. Create and join pages wired to callable Functions with user-friendly error messages.
5. Dynamic room route added to receive post-submit redirects.
6. Home page navigation added for direct create/join entry.
7. Timer settings were removed from room config (`answerTimeLimitSec`, `votingTimeLimitSec`).
8. No timer-based phase transitions introduced.

Outcome:

- End-to-end create/join flow now works against local emulators.
- On success, users land on `/games/guess-the-liar/room/{roomCode}`.
- Room + player docs are written via Functions (client writes blocked by rules for those paths).
- Room settings are now timer-free and manual progression is enforced by design.

---

## End-to-End Execution Order (Current State)

1. `layout.tsx` renders app shell and mounts auth bootstrap.
2. Firebase singleton reads validated web config.
3. In dev/demo mode, client connects to local Auth + Firestore emulators.
4. Anonymous user bootstrap runs.
5. `useAuthUser()` listeners receive and expose auth state.
6. User submits create/join forms which call callable Functions.
7. Functions write room/player docs and return room code.
8. Client redirects to room route shell for that code.

---

## Current Verification Checklist

1. `npm run lint` -> expect no errors.
2. `cd functions && npm install` -> ensure Functions deps exist.
3. `firebase emulators:start --only auth,firestore,functions` -> expect Functions definitions to load.
4. `npm run dev` -> app boots without Firebase config/runtime errors.
5. From `/`, run create and join flows.
6. Emulator UI (`http://127.0.0.1:4000`) shows local auth/firestore activity and room/player docs.

---

## Open TODOs

1. Increment 7: add room/player real-time subscriptions + lobby UI state.
2. Keep phase progression manual/host-driven (no timers).
3. Continue tightening rules for new subcollections as increments add data paths.
4. Plan a dedicated Cloud Functions JavaScript -> TypeScript migration increment after core loop stability.
5. Keep architecture/roadmap/increment docs synchronized with each merge.
