# PlotTwist — Increment Roadmap

> This plan reflects the critique of an earlier 12-increment draft.
> Key principles: every increment has a **testable outcome**, no dead code, no placeholder files,
> and security rules ship alongside the data they protect.

---

## Guiding Rules

1. **Max 3 files per increment** — keeps scope small and rollback cheap
2. **Short-lived branch per increment** — branch off `main`, merge when green
3. **Every increment must be individually testable** — if you can't verify it, the scope is wrong
4. **Security rules ship with the data they protect** — never defer rules to a later "hardening" increment
5. **No new dependencies without explicit approval**

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete |
| 🔄 | In progress |
| ⬜ | Not started |

---

## ✅ Increment 1 — Config Foundation

**Branch:** `wip/inc1-firebase-bootstrap`

**Files changed:**
- `src/lib/firebase/config.ts`

**What it does:**
- Defines required Firebase env key type
- Reads all `NEXT_PUBLIC_FIREBASE_*` values from the environment
- Throws immediately with a clear message if any are missing
- Exports `getFirebaseWebConfig()` returning a typed config object

**Testable outcome:** Running the app with a missing env var throws an explicit error naming the missing key.

---

## ✅ Increment 2 — Runtime Bootstrap

**Branch:** `wip/inc2-firebase-runtime`

**Files changed:**
- `package.json` (added `firebase` SDK)
- `src/lib/firebase/client.ts`
- `src/lib/firebase/auth.ts`

**What it does:**
- Installs Firebase SDK
- Initializes a singleton Firebase app (guarded against double-init)
- Exports `auth` and `db` singletons
- Adds `ensureAnonymousUser()` helper — returns existing user or signs in anonymously

**Testable outcome:** `ensureAnonymousUser()` resolves with an anonymous Firebase user in the browser console.

---

## ✅ Increment 3 — Auth Wiring

**Branch:** `wip/inc3-auth-wiring`

**Files changed (≤ 3):**
- `src/components/AuthBootstrap.tsx`
- `src/app/layout.tsx`
- `src/lib/firebase/use-auth-user.ts`

**What it does:**
- `AuthBootstrap` fires `ensureAnonymousUser()` on mount (renders nothing)
- Root `layout.tsx` mounts `<AuthBootstrap />` so auth starts on every page load
- `useAuthUser` hook subscribes to `onAuthStateChanged`, exposes `{ user, loading }`

**Testable outcome:** Open any page, check DevTools → Firebase Auth panel → anonymous user is present. `useAuthUser()` returns a non-null user.

---

## ✅ Increment 4 — Types + Prompt Bank

**Branch:** `wip/inc4-types`

**Files changed (≤ 3):**
- `src/lib/types.ts`
- `src/features/guess-the-liar/prompts.ts`

**What it does:**
- Defines all canonical game types: `Room`, `Player`, `Phase`, `RoundMeta`, `PlayerPrompt`, `Answer`, `Vote`, `RoundSecret`
- Types match the Firestore data model in ARCHITECTURE.md exactly (subcollections, `{round}_{playerId}` doc IDs)
- Adds prompt bank (8+ general/imposter question pairs)

**Testable outcome:** `npm run lint` passes. All types are importable. No `any` anywhere.

---

## ✅ Increment 5 — Firebase Project Init + Emulator

**Branch:** `wip/inc5-firebase-init`

**Files changed (actual):**
- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `functions/package.json`
- `functions/index.js`
- `functions/package-lock.json`
- `src/lib/firebase/client.ts`
- `.env.local` (local env, ignored by git)

**Scope note:** This increment exceeded the normal 3-file rule because emulator boot failures required iterative infra debugging and local/runtime alignment fixes.

**What it does:**
- Runs `firebase init` (Firestore, Functions, Emulators)
- Configures emulators for Auth, Firestore, Functions
- Fixes Functions runtime detection (`Could not detect runtime`) by adding Functions package metadata + entrypoint
- Adds explicit Firestore emulator rules mapping
- Switches default project to local-only `demo-plottwist`
- Wires client Firebase runtime to local Auth/Firestore emulators in dev/demo mode
- Installs required Functions dependencies (`firebase-functions`, `firebase-admin`)

**Testable outcome:** `firebase emulators:start --only auth,firestore,functions` starts, and Functions logs `Loaded functions definitions from source: .`

> **Why before any UI:** Every future increment that tests against Firebase must have a local emulator target. Without this, every test run burns real quota and you can't reset state.

---

## ✅ Increment 6 — Create + Join (Full Stack)

**Branch:** `wip/inc6-create-join`

**Files changed (actual):**
- `functions/index.js` — `createRoom` + `joinRoom` callable Functions
- `firestore.rules`
- `src/lib/firebase/client.ts` (Functions emulator wiring/export)
- `src/app/games/guess-the-liar/create/page.tsx`
- `src/app/games/guess-the-liar/join/page.tsx`
- `src/app/games/guess-the-liar/room/[roomCode]/page.tsx` (redirect target shell)
- `src/app/page.tsx` (create/join entry navigation)

**Scope note:** Delivered in multiple ≤3-file batches. Total increment file count exceeds 3 due phased implementation and debugging.

**Security rules shipped with this increment:**
- `rooms/{roomCode}` — readable by any authenticated user, writable only by Cloud Functions
- `rooms/{roomCode}/players/{playerId}` — readable by room members, writable only by Cloud Functions

**What it does:**
- `createRoom` Cloud Function: generates unique room code, writes initial room doc, adds host to players subcollection, returns room code
- `joinRoom` Cloud Function: validates room exists + has capacity + phase=lobby + player not already joined, adds player doc
- Duplicate join is idempotent success
- Create page: name input → calls `createRoom` → redirects to `/games/guess-the-liar/room/{code}`
- Join page: name + room code input → calls `joinRoom` → redirects to `/games/guess-the-liar/room/{code}`
- Room route shell exists so redirects do not 404
- Home page links directly to create/join routes
- No timer-based transitions were introduced
- Room settings timer fields were removed (`answerTimeLimitSec`, `votingTimeLimitSec`)

**Testable outcome:** Create a room, share the code, join it from another browser tab. Both players appear in Firestore.

---

## ✅ Increment 7 — Room Real-Time + Lobby UI

**Branch:** `wip/inc7-lobby`

**Files changed (≤ 3):**
- `src/app/games/guess-the-liar/room/[roomCode]/page.tsx`
- `src/features/guess-the-liar/components/RoomScreen.tsx` (lobby phase only)
- `src/features/guess-the-liar/room-store.ts` (subscribe functions only)

**What it does:**
- `onSnapshot` listener on `rooms/{roomCode}` for room state
- `onSnapshot` listener on `rooms/{roomCode}/players` for player list
- Lobby UI: shows connected players, host badge, room code with copy button
- Host sees "Start Round" button (disabled until ≥ 3 players)
- Non-hosts see "Waiting for host..."
- Join flow explains same-device idempotent rejoin with explicit UI banner
- Join page shows identity-preparation status to clarify initial latency

**Testable outcome:** Open the room URL in two tabs. Player list updates in real time as players join. Actions are correctly gated by host status.

---

## ⬜ Increment 8 — Start Round + Answering Phase

**Branch:** `wip/inc8-answering`

**Files changed (≤ 3):**
- `functions/index.js` — add `startRound` Cloud Function
- `src/features/guess-the-liar/components/RoomScreen.tsx` — add answering phase UI
- Firestore security rules — add `prompts/{playerId}` + `answers/{docId}` rules

**What it does:**
- `startRound` Cloud Function: selects imposter randomly, writes each player's prompt to `prompts/{playerId}`, writes imposter identity to `secrets/round_{n}`, sets phase → `answering`, sets deadline timestamp
- Client subscribes to `rooms/{roomCode}/prompts/{uid}` to get own private prompt
- Answering UI: shows your private prompt, textarea for answer, submit button
- `submitAnswer` writes to `answers/{round}_{playerId}` (client direct write, rules enforce write-once + correct phase)
- Host sees "Reveal Answers" (enabled when `totalAnswers === playerCount`)

**Security rules shipped:**
- `prompts/{playerId}` — readable only by the matching player
- `answers/{docId}` — write-once, only during `answering` phase, only by matching player

**Testable outcome:** Start a round as host. Each player sees a different prompt (imposter gets the different question). Submit answers. "Reveal Answers" enables when everyone is done.

---

## ⬜ Increment 9 — Reveal, Vote, Score (Full Round Loop)

**Branch:** `wip/inc9-round-loop`

**Files changed (≤ 3):**
- `functions/index.js` — add `advancePhase` + `scoreRound` Cloud Functions
- `src/features/guess-the-liar/components/RoomScreen.tsx` — add revealed / voting / scoring phase UIs
- Firestore security rules — add `votes/{docId}` rules

**What it does:**
- `advancePhase` Cloud Function: validates current phase, transitions to `revealed` or `voting`
- `scoreRound` Cloud Function: tallies votes, updates player scores, writes `imposterId` to room doc, sets phase → `scoring`
- Revealed UI: displays all answers anonymously as "Answer #1, #2..."
- Voting UI: player list with vote buttons, cannot vote for self, write-once enforced by rules
- Scoring UI: animated winner banner, shows imposter name, host can start next round

**Security rules shipped:**
- `votes/{docId}` — write-once, only during `voting` phase, only by matching voter

**Testable outcome:** Play one complete round from lobby → answering → revealed → voting → scoring → back to lobby. Scores increment correctly. Imposter is revealed only at scoring.

---

## ⬜ Increment 10 — Multi-Round Loop + Polish

**Branch:** `wip/inc10-polish`

**Files changed (≤ 3):**
- `src/features/guess-the-liar/components/RoomScreen.tsx` — edge cases + polish
- `src/app/games/guess-the-liar/page.tsx` — game landing page

**What it does:**
- Round restart works cleanly (answers/votes from previous rounds don't bleed into new round because of `{round}_{playerId}` doc IDs)
- Score accumulates across rounds and displays on player list
- Handles: player not in room (redirect to join), room not found (clear error), auth still loading (loading state)
- Adds game intro / landing page at `/games/guess-the-liar`

**Testable outcome:** Play 3 rounds in a row without bugs. Scores are correct. Edge cases (late joiner, room not found) show clean error states.

---

## V2 Roadmap (Post-Increment 10)

These are deferred intentionally — they add complexity without unblocking the core gameplay loop.

| Feature | Why deferred |
|---------|-------------|
| Presence / online status | Requires Firebase RTDB or keepalive; not needed for V1 fun |
| Host promotion on disconnect | Complex edge case; V1 just blocks on host loss |
| Voting deadline enforcement (scheduled function) | Requires composite Firestore index + scheduled Cloud Function; manual host control works for V1 |
| Anti-abuse / rate limiting | Needed at scale, not needed for private party sessions |
| Analytics / observability | Useful once shipped, not a blocker |
| `imposter` game mode | Second game mode; engine is designed to be extensible |
| Firestore emulator CI integration | Good practice, adds setup overhead |
| Cloud Functions JS -> TypeScript migration | Useful for backend type safety; deferred until core game loop stabilizes |
