# Increment 5 - Firebase Project Init + Local Emulator Wiring (Explained)

## TL;DR

Increment 5 took us from "Firebase files exist" to a working local-only emulator setup that the web app actually uses.

1. Fixed Functions emulator runtime detection (it could not detect runtime in `functions/`).
2. Added explicit Firestore rules config for emulator startup.
3. Switched project targeting to a fake local-only demo project (`demo-plottwist`).
4. Updated client env and Firebase client bootstrap so app traffic goes to local emulators in development.
5. Installed required Functions dependencies so definitions load correctly.

Result: `firebase emulators:start --only auth,firestore,functions` starts, and Functions now loads definitions from source.

---

## ELI5 Version

Think of this like setting up a toy city for practice instead of using the real city.

1. We gave the Functions "building" a proper nameplate so Firebase can recognize what it is.
2. We added local traffic rules (Firestore rules file) so the city has clear defaults.
3. We changed the map to a fake practice city (`demo-plottwist`) so we don't accidentally drive into production.
4. We told the app GPS to always drive to local streets (Auth/Firestore emulators) during development.
5. We installed missing parts (`firebase-functions`, `firebase-admin`) so the Functions building can open.

---

## Goal

Make Firebase Emulator Suite reliable and safe for local development before any room/game backend features are implemented.

---

## Non-Goals (Intentionally Not Done Yet)

1. No `createRoom`/`joinRoom` business logic.
2. No room UI pages.
3. No production security rules hardening (local rules are intentionally permissive for now).

---

## What Broke Initially

Functions emulator failed with:

- `Failed to load function definition from source: FirebaseError: Could not detect runtime for functions at .../functions`

Later, after adding runtime metadata, it failed again until dependencies were installed:

- `Cannot find module 'firebase-functions'`

We also hit temporary port collisions from stale emulator processes (4000/9099/8080/5001).

---

## Files Changed

1. `firebase.json`
2. `.firebaserc`
3. `firestore.rules`
4. `functions/package.json`
5. `functions/index.js`
6. `functions/package-lock.json`
7. `src/lib/firebase/client.ts`
8. `.env.local` (local env, ignored by git)

---

## What Each Change Does

## 1) `firebase.json`

1. Keeps Functions source set to `functions/`.
2. Adds Firestore rules mapping:
   - `"firestore": { "rules": "firestore.rules" }`
3. Keeps emulator ports explicit for auth/firestore/functions/ui.

## 2) `.firebaserc`

1. Changes default project from real project ID to:
   - `demo-plottwist`
2. Ensures emulator-first, local-only behavior.

## 3) `firestore.rules`

1. Adds explicit rules file so emulator no longer relies on implicit defaults.
2. Uses permissive local-dev rule:
   - `allow read, write: if true;`

## 4) `functions/package.json`

1. Declares runtime metadata (`main`, `engines.node`).
2. Adds required dependencies:
   - `firebase-functions`
   - `firebase-admin`
3. Adds lightweight scripts for local Functions workflows.

## 5) `functions/index.js`

1. Adds minimal entrypoint export (`module.exports = {}`).
2. Unblocks Functions runtime loading before real handlers are implemented.

## 6) `src/lib/firebase/client.ts`

1. Keeps singleton app/auth/db initialization.
2. Adds development emulator wiring:
   - `connectAuthEmulator(...)`
   - `connectFirestoreEmulator(...)`
3. Enables this when:
   - `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`, or
   - project ID starts with `demo-`
4. Guards connection to run once via a global flag.

## 7) `.env.local`

1. Switched project-related values to `demo-plottwist`.
2. Added:
   - `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`

---

## Runtime Flow After Increment 5

1. `firebase emulators:start` boots Auth/Firestore/Functions for `demo-plottwist`.
2. Next.js app reads Firebase web config from env.
3. Firebase client singleton initializes once.
4. In dev/demo mode, client connects to local Auth + Firestore emulators.
5. App auth/database traffic stays local.

---

## Manual Verification Checklist

1. Install Functions deps (first time / after lockfile changes):
   - `cd functions && npm install`
2. Start emulators:
   - `firebase emulators:start --only auth,firestore,functions`
3. Confirm Functions line appears:
   - `Loaded functions definitions from source: .`
4. Open emulator UI:
   - `http://127.0.0.1:4000`
5. Run app:
   - `npm run dev`
6. Confirm auth/firestore activity appears in Emulator UI.

---

## Known Warnings (Current)

1. Node mismatch warning:
   - `engines.node` is `22`, host Node is `24`.
   - Local dev still works.
2. Deprecation warnings (`punycode`, `url.parse`) come from tooling chain and are non-blocking for now.

---

## Why This Increment Matters

Without this setup, local testing could silently hit real Firebase services, causing mixed environments, higher debugging cost, and possible quota/cost risk. Increment 5 puts all auth/firestore/functions testing on a controlled local path.

---

## TODOs for Increment 6

1. Replace placeholder Functions export with real callable handlers (`createRoom`, `joinRoom`).
2. Add corresponding client pages/flows for create/join.
3. Replace permissive Firestore rules with mode-specific rules once room schema lands.
