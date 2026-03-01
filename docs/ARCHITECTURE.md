# PlotTwist — Architecture

> **Version:** 3.0  
> **Last updated:** February 2026  
> **Status:** Pre-production (V1)

PlotTwist is a real-time multiplayer party-game platform.  
The first game mode is **Guess the Liar** — one player secretly receives a different prompt than everyone else, and the group tries to figure out who it is.

This document describes the **V1 architecture** — designed to be shippable, solid, and not overengineered. It prioritizes getting a fun playable loop live, while keeping the door open for hardening later.

The platform is designed to:

- Host multiple distinct game modes under one roof
- Share a common real-time room engine across all modes
- Enforce strict data privacy between players
- Handle race conditions and basic disconnections gracefully
- Deploy safely via Vercel + Firebase

---

# Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [High-Level Data Flow](#3-high-level-data-flow)
4. [Routing Architecture](#4-routing-architecture)
5. [Game Architecture](#5-game-architecture)
6. [State Machine](#6-state-machine)
7. [Data Model](#7-data-model)
8. [Prompt Privacy & Security](#8-prompt-privacy--security)
9. [Firestore Security Rules](#9-firestore-security-rules)
10. [Real-Time Strategy](#10-real-time-strategy)
11. [Concurrency & Conflict Resolution](#11-concurrency--conflict-resolution)
12. [Disconnection & Recovery](#12-disconnection--recovery)
13. [Timing & Countdown Strategy](#13-timing--countdown-strategy)
14. [Performance Constraints & Limits](#14-performance-constraints--limits)
15. [UI Architecture](#15-ui-architecture)
16. [Authentication & Session Management](#16-authentication--session-management)
17. [Extensibility](#17-extensibility)
18. [Testing Strategy](#18-testing-strategy)
19. [Observability & Debugging](#19-observability--debugging)
20. [Deployment Strategy](#20-deployment-strategy)
21. [V2 Roadmap](#21-v2-roadmap)

---

# 1. System Overview

## Core Principles

| Principle | What it means in practice |
|---|---|
| Real-time multiplayer | Every player sees the same game state within ~1 s |
| Deterministic state machine | Game phases transition via explicit, validated writes — never implicit |
| Privacy by design | Players cannot read each other's prompts, even via DevTools |
| Graceful degradation | Disconnections and tab-closes don't break the room for other players |
| Type safety | All shared data structures are defined as TypeScript types and validated at the boundary |
| Platform extensibility | Adding a new game mode requires zero changes to the room engine |
| Ship fast, harden later | V1 gets the game loop working; presence, anti-abuse, and analytics come in V2 |

---

# 2. Tech Stack

## Frontend

| Tool | Purpose |
|---|---|
| **Next.js (App Router)** | File-system routing, SSR/SSG, API routes |
| **React** | Component model, hooks, concurrent features |
| **TypeScript** | Static type checking for frontend and shared domain types |
| **Tailwind CSS** | Utility-first styling, design tokens |

> Exact versions are pinned in `package.json` — this doc references tools, not version numbers.

## Backend — Firebase

| Service | Purpose |
|---|---|
| **Firebase Anonymous Auth** | Lightweight player identity without sign-up friction |
| **Cloud Firestore** | Real-time document database — single source of truth for room state |
| **Cloud Functions (v2)** | Server-side game logic: phase transitions, prompt assignment, scoring |

> **Current implementation note:** Functions runtime currently uses JavaScript entrypoint `functions/index.js`. A clean migration to TypeScript is planned after the core loop is stable.

## Infrastructure

| Tool | Purpose |
|---|---|
| **Vercel** | Production hosting, preview deploys, edge network |
| **GitHub Actions** | CI pipeline — lint, type-check, test, build |

### Why Firebase instead of a custom backend?

- Real-time listeners are built in — no WebSocket server to manage
- Anonymous Auth removes sign-up friction for a party game
- Cloud Functions handle trusted game logic without a full server
- Firestore security rules enforce per-player data isolation at the database layer
- Scales automatically with player count

---

# 3. High-Level Data Flow

```
┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Client A   │────────▶│  Cloud Firestore  │◀────────│   Client B   │
│  (React UI)  │◀────────│  (source of       │────────▶│  (React UI)  │
│              │         │   truth)          │         │              │
└──────────────┘         └────────┬─────────┘         └──────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Cloud Functions  │
                         │  (trusted logic)  │
                         │                   │
                         │  • Assign prompts  │
                         │  • Transition      │
                         │    phases          │
                         │  • Calculate       │
                         │    scores          │
                         └──────────────────┘
```

### What runs where

| Concern | Runs on | Why |
|---|---|---|
| UI rendering, local form state | Client (React) | No integrity risk |
| Room creation | Cloud Function `createRoom` | Generates unique code, initializes doc |
| Joining a room | Cloud Function `joinRoom` | Validates capacity, prevents duplicates |
| Starting a round | Cloud Function `startRound` | Assigns prompts, sets deadline, transitions phase |
| Advancing phase | Cloud Function `advancePhase` | Validates current state, enforces transition rules |
| Scoring a round | Cloud Function `scoreRound` | Tallies votes, updates scores, reveals imposter |
| Submitting an answer | Client → Firestore (with security rules) | Low-latency write; rules enforce write-once + correct phase |
| Submitting a vote | Client → Firestore (with security rules) | Same as answers — rules handle integrity |
| Real-time state sync | Firestore `onSnapshot` → Client | Built-in, no custom infra |

**Rule of thumb:** If it affects game integrity or requires reading data the client shouldn't see, it's a Cloud Function. If it's a simple validated write, security rules are enough.

---

# 4. Routing Architecture

Next.js App Router maps folders to URL segments.

## Rules

- Folder name = URL segment
- `page.tsx` = route entry point
- `[param]` = dynamic route segment
- `layout.tsx` = persistent wrapper for a route subtree

## Route Map

```txt
src/
  app/
    layout.tsx                       → Root layout (global providers, theme)
    page.tsx                         → "/" (landing / game picker)
    games/
      layout.tsx                     → Shared games wrapper (optional)
      guess-the-liar/
        page.tsx                     → "/games/guess-the-liar" (mode intro)
        create/
          page.tsx                   → "/games/guess-the-liar/create"
        join/
          page.tsx                   → "/games/guess-the-liar/join"
        room/
          [roomCode]/
            page.tsx                 → "/games/guess-the-liar/room/:roomCode"
            components/              → Room-scoped components (LobbyView, AnswerView, etc.)
      imposter/
        page.tsx                     → "/games/imposter"
```

### Shared layouts

- The root `layout.tsx` wraps every page with global providers (Firebase context, theme, toast system).
- The `games/layout.tsx` can enforce authentication and provide a shared game chrome (e.g., back button, room code display).

---

# 5. Game Architecture

## Core Game Loop — Guess the Liar

```
┌─────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
│  LOBBY   │────▶│ PROMPTING │────▶│ ANSWERING │────▶│ REVEALED │
│          │     │ (server)  │     │           │     │          │
└─────────┘     └──────────┘     └───────────┘     └────┬─────┘
     ▲                                                    │
     │           ┌──────────┐     ┌──────────┐            │
     └───────────│ SCORING  │◀────│  VOTING  │◀───────────┘
                 └──────────┘     └──────────┘
```

### Step-by-step

| Step | Who triggers | What happens |
|---|---|---|
| 1. Create room | Host (client) | Calls Cloud Function `createRoom` → generates room code, writes initial doc |
| 2. Join room | Player (client) | Calls Cloud Function `joinRoom` → validates capacity, writes player doc to subcollection |
| 3. Start round | Host (client) | Calls Cloud Function `startRound` |
| 4. Assign prompts | Cloud Function | Picks imposter, writes private prompts to subcollection |
| 5. Set phase → `answering` | Cloud Function | Updates room `phase`, sets `deadline` timestamp |
| 6. Submit answer | Player (client) | Writes to `answers/{round}_{playerId}` (once, validated by rules) |
| 7. Answering ends | Cloud Function (scheduled or callable) | Transitions phase → `revealed`, publishes round `publicPrompt` |
| 8. Reveal answers + shared prompt | Automatic | Clients read all answers and `round.publicPrompt` for the current round |
| 9. Vote | Players (client) | Each player writes to `votes/{round}_{voterId}` (once, validated by rules) |
| 10. Calculate scores | Cloud Function `scoreRound` | Tallies votes, updates player scores, reveals imposter identity |
| 11. Next round or end | Host (client) | Calls `startRound` again or ends game |

---

# 6. State Machine

The game uses a **finite state machine** with explicit transitions. Invalid transitions are rejected by Cloud Functions.

## Phase Transitions

```
lobby ──▶ prompting ──▶ answering ──▶ revealed ──▶ voting ──▶ scoring ──▶ lobby
                                                                          │
                                                                          ▼
                                                                       finished
```

## Transition Rules

| From | To | Trigger | Guard condition |
|---|---|---|---|
| `lobby` | `prompting` | Host calls `startRound` | ≥ 3 players in room |
| `prompting` | `answering` | Cloud Function | All prompts written to private subcollection |
| `answering` | `revealed` | Cloud Function | Deadline expired OR all players submitted; transition also publishes `round.publicPrompt` |
| `revealed` | `voting` | Host calls `advancePhase` | All answers visible |
| `voting` | `scoring` | Cloud Function | All votes submitted OR voting deadline expired |
| `scoring` | `lobby` | Host calls `startRound` | — |
| `scoring` | `finished` | Host ends game | — |

### Invalid transitions

Any write that attempts a transition not in this table is rejected by Cloud Functions. The client never sets `phase` directly — it always goes through a callable function that validates the current state first.

---

# 7. Data Model

All types live in `src/lib/types.ts` and are the canonical source of truth.

## Design Decisions

| Decision | Rationale |
|---|---|
| Players in a **subcollection**, not a map on the room doc | Room doc stays small and stable. Player joins and score updates don't trigger a room snapshot for all clients. Reduces concurrency conflicts and write fan-out. |
| Answers and votes keyed by **round number** | Doc IDs are `{roundNumber}_{playerId}` — players can answer once per round across multiple rounds. A flat `answers/{playerId}` path would break after Round 1 because the doc already exists. |
| No `isImposter` field in prompt docs | The imposter can already infer their role from their distinct question. Storing `isImposter: true` increases the blast radius if prompt docs ever leak. Imposter identity stays server-side until scoring. |
| Shared prompt revealed only after answers | `round.publicPrompt` stays `null` during `prompting`/`answering`, then Cloud Function publishes it on `answering` → `revealed` so voting context is shared without leaking early. |
| Imposter identity revealed only at scoring | Cloud Function writes `imposterId` to the room doc only when transitioning to `scoring`. Before that, it exists only in a server-only `secrets` subcollection that clients cannot read. |

## Firestore Document: `rooms/{roomCode}`

The room doc is intentionally **lean** — only public, stable state lives here.

```ts
type Room = {
  roomCode: string;
  mode: GameMode;
  hostId: string;               // Firebase Auth UID of the host
  createdAt: Timestamp;         // Firestore server timestamp
  updatedAt: Timestamp;         // Last state change

  phase: Phase;
  settings: RoomSettings;

  playerCount: number;          // Denormalized count — incremented by joinRoom function
  round: RoundMeta | null;

  imposterId: string | null;    // Written ONLY when phase = "scoring"; null otherwise
};

type GameMode = "guess-the-liar" | "imposter";

type Phase =
  | "lobby"
  | "prompting"
  | "answering"
  | "revealed"
  | "voting"
  | "scoring"
  | "finished";

type RoomSettings = {
  maxPlayers: number;           // default: 10, max: 20
  answerTimeLimitSec: number;   // default: 60
  votingTimeLimitSec: number;   // default: 30
  totalRounds: number;          // default: 5
};
```

## Subcollection: `rooms/{roomCode}/players/{playerId}`

```ts
type Player = {
  id: string;                   // Firebase Auth UID
  name: string;                 // Display name (sanitized, max 20 chars)
  joinedAt: Timestamp;
  score: number;                // Cumulative score across rounds
};
```

Player docs are created by the `joinRoom` Cloud Function and updated by `scoreRound`. Clients listen to the players collection for the player list and live scores.

## Round Metadata (on room doc)

Contains no secret information. Updated by Cloud Functions only.

```ts
type RoundMeta = {
  roundNumber: number;
  startedAt: Timestamp;
  deadline: Timestamp;          // Server-calculated end time for current phase
  publicPrompt: string | null;  // Null until `revealed`; then shown to everyone
  totalAnswers: number;         // Incremented as answers arrive (no content leaked)
  totalVotes: number;           // Incremented as votes arrive
};
```

## Subcollection: `rooms/{roomCode}/prompts/{playerId}`

Private — each player can only read their own document. Overwritten each round by the `startRound` Cloud Function.

```ts
type PlayerPrompt = {
  playerId: string;
  question: string;             // The prompt this specific player sees
  roundNumber: number;
};
```

> **No `isImposter` field.** The imposter sees a different question — that's how they know their role. The actual imposter identity is stored in `rooms/{roomCode}/secrets/round_{n}` (readable only by Cloud Functions via Admin SDK) and revealed to clients only at scoring time.

## Subcollection: `rooms/{roomCode}/answers/{round}_{playerId}`

Write-once per round. Document ID is `{roundNumber}_{playerId}`.

```ts
type Answer = {
  playerId: string;
  text: string;                 // Max 500 chars, sanitized
  submittedAt: Timestamp;
  roundNumber: number;
};
```

## Subcollection: `rooms/{roomCode}/votes/{round}_{voterId}`

Write-once per round. Document ID is `{roundNumber}_{voterId}`.

```ts
type Vote = {
  voterId: string;
  suspectId: string;            // The player they think is the liar
  roundNumber: number;
  submittedAt: Timestamp;
};
```

## Server-Only: `rooms/{roomCode}/secrets/round_{n}`

Clients cannot read or write this. Cloud Functions use Admin SDK to access it.

```ts
type RoundSecret = {
  imposterId: string;           // Who was assigned the imposter question
  generalQuestion: string;      // Published to room.round.publicPrompt at `revealed`
  roundNumber: number;
};
```

---

# 8. Prompt Privacy & Security

## Threat Model

In a party game, the primary threat is a **curious player** who:

- Opens browser DevTools to inspect network requests
- Reads the Firestore snapshot payload
- Tries to see other players' prompts or the imposter's identity

## Solution: Private Subcollections + Cloud Functions

Prompt assignment is **never done on the client**. The flow is:

1. Host clicks "Start Round"
2. Client calls `startRound` Cloud Function
3. Cloud Function:
   - Selects imposter randomly
   - Writes each player's prompt to `rooms/{roomCode}/prompts/{playerId}` — all prompt docs look structurally identical (just `question` + `roundNumber`, no `isImposter` flag)
   - Stores imposter identity and `generalQuestion` in `rooms/{roomCode}/secrets/round_{n}` (client-inaccessible)
   - Sets room phase to `answering`
4. Each client subscribes to `rooms/{roomCode}/prompts/{myUid}`
5. Firestore security rules ensure `playerId === request.auth.uid`

**Result:** Even if a player inspects every network request, they only ever receive their own prompt document during answering. The shared prompt is published to `round.publicPrompt` only at `revealed`, and imposter identity is still hidden until `scoring`.

### Why no `isImposter` field?

Storing `isImposter: true` on the prompt doc is unnecessary — the imposter can tell from their question. Not storing it means even if prompt documents were somehow leaked (misconfigured rules, bug), no one could trivially grep for `isImposter: true` to find the liar.

### Answer visibility

Answers are stored in a subcollection with per-round document IDs. Security rules enforce:

- During `answering` phase: a player can only write their own answer, cannot read any answers
- During `revealed` / `voting` / `scoring` phases: all answers for the current round become readable
- A player can only submit one answer per round (document ID includes round number, so `!exists` works correctly across rounds)

---

# 9. Firestore Security Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- Room document ---
    match /rooms/{roomCode} {
      // Anyone authenticated can read the room (public state only)
      allow read: if request.auth != null;

      // Only Cloud Functions write room state (Admin SDK bypasses rules)
      allow write: if false;

      // --- Players (subcollection) ---
      match /players/{playerId} {
        // Anyone authenticated can read any player doc (names, scores)
        allow read: if request.auth != null;

        // Only Cloud Functions write player docs (joinRoom, scoreRound)
        allow write: if false;
      }

      // --- Server-only secrets ---
      match /secrets/{docId} {
        // Clients can never read or write secrets
        allow read, write: if false;
      }

      // --- Private prompts ---
      match /prompts/{playerId} {
        // Players can only read their own prompt
        allow read: if request.auth != null
                    && request.auth.uid == playerId;

        // Only Cloud Functions write prompts
        allow write: if false;
      }

      // --- Answers (doc ID = {roundNumber}_{playerId}) ---
      match /answers/{docId} {
        // Player can create their own answer, once per round
        allow create: if request.auth != null
                      && request.resource.data.playerId == request.auth.uid
                      && get(/databases/$(database)/documents/rooms/$(roomCode)).data.phase == "answering"
                      && !exists(/databases/$(database)/documents/rooms/$(roomCode)/answers/$(docId));

        // No updates or deletes
        allow update, delete: if false;

        // Readable by all players when phase is revealed or later
        allow read: if request.auth != null
                    && get(/databases/$(database)/documents/rooms/$(roomCode)).data.phase in ["revealed", "voting", "scoring", "finished"];
      }

      // --- Votes (doc ID = {roundNumber}_{voterId}) ---
      match /votes/{docId} {
        // Player can vote once per round during voting phase
        allow create: if request.auth != null
                      && request.resource.data.voterId == request.auth.uid
                      && get(/databases/$(database)/documents/rooms/$(roomCode)).data.phase == "voting"
                      && !exists(/databases/$(database)/documents/rooms/$(roomCode)/votes/$(docId));

        allow update, delete: if false;

        // Readable after scoring
        allow read: if request.auth != null
                    && get(/databases/$(database)/documents/rooms/$(roomCode)).data.phase in ["scoring", "finished"];
      }
    }
  }
}
```

> **Note:** All game-critical writes (room creation, joining, phase transitions, prompt assignment, scoring) go through Cloud Functions using the Admin SDK, which bypasses security rules entirely. The rules above protect against **direct client-side** reads and writes only.

### Rules for client-written data (answers + votes)

These are the only two operations where the client writes directly to Firestore:

| Check | Purpose |
|---|---|
| `request.resource.data.playerId == request.auth.uid` | Players can only write their own data |
| `phase == "answering"` / `phase == "voting"` | Writes are only allowed during the correct phase |
| `!exists(docId)` | Prevents double-submission within the same round |
| `allow update, delete: if false` | Data is immutable once written |

The composite document ID (`{round}_{playerId}`) ensures that a player can answer/vote once **per round** — fixing the bug where flat `answers/{playerId}` would block all submissions after Round 1.

---

# 10. Real-Time Strategy

## Firestore Listeners

Each client maintains these active listeners:

| Listener | Path | Purpose | Active when |
|---|---|---|---|
| Room state | `rooms/{roomCode}` | Phase, round metadata, settings, imposter reveal | Always |
| Players | `rooms/{roomCode}/players` (collection) | Player names, scores, count | Always |
| My prompt | `rooms/{roomCode}/prompts/{myUid}` | The question assigned to me this round | `prompting` → `answering` |

Additional listeners are attached conditionally:

| When phase is... | Also listen to | Purpose |
|---|---|---|
| `revealed`, `voting`, `scoring` | `rooms/{roomCode}/answers` where `roundNumber == current` | Display all submitted answers |
| `scoring`, `finished` | `rooms/{roomCode}/votes` where `roundNumber == current` | Display vote breakdown |

### Why conditional listeners?

- Reduces Firestore read costs during phases where data isn't needed
- Prevents unnecessary data transfer (answers are unreadable before `revealed` anyway, but not subscribing is defense-in-depth)

## Client State Management

```
Firestore snapshots ──▶ React Context (RoomProvider) ──▶ Phase-based components
```

- `RoomProvider` wraps the room page and holds the latest snapshots (room doc + players collection)
- Components consume `useRoom()` hook — no prop drilling
- The UI is a pure function of `room.phase` — changing the phase changes what renders
- **No local game state** — Firestore is the single source of truth

---

# 11. Concurrency & Conflict Resolution

### Problem

Multiple clients may attempt simultaneous writes:

- Two players submit answers at the same time
- Host clicks "Start Round" twice rapidly
- A player tries to join as the room reaches max capacity

### Solution: Firestore Transactions in Cloud Functions

All Cloud Function operations use **Firestore transactions**:

```ts
// Example: startRound Cloud Function (pseudocode)
exports.startRound = onCall(async (request) => {
  const { roomCode } = request.data;
  const uid = request.auth?.uid;

  await db.runTransaction(async (tx) => {
    const roomRef = db.doc(`rooms/${roomCode}`);
    const room = (await tx.get(roomRef)).data();

    // Guard: only host can start
    if (room.hostId !== uid) throw new Error("Not the host");

    // Guard: must be in lobby or scoring phase (for next round)
    if (room.phase !== "lobby" && room.phase !== "scoring")
      throw new Error("Invalid phase");

    // Guard: minimum players
    if (room.playerCount < 3) throw new Error("Need at least 3 players");

    // Read player IDs from subcollection
    const playersSnap = await tx.get(
      db.collection(`rooms/${roomCode}/players`)
    );
    const playerIds = playersSnap.docs.map((d) => d.id);

    // Pick imposter (identity stays in this function's memory)
    const imposterId = playerIds[Math.floor(Math.random() * playerIds.length)];
    const nextRound = (room.round?.roundNumber ?? 0) + 1;

    // Write private prompts — NO isImposter field
    for (const pid of playerIds) {
      const promptRef = db.doc(`rooms/${roomCode}/prompts/${pid}`);
      tx.set(promptRef, {
        playerId: pid,
        question: pid === imposterId ? imposterQuestion : generalQuestion,
        roundNumber: nextRound,
      });
    }

    // Store imposter identity + general question server-side only
    tx.set(db.doc(`rooms/${roomCode}/secrets/round_${nextRound}`), {
      imposterId,
      generalQuestion,
      roundNumber: nextRound,
    });

    // Transition phase — imposterId is NOT written to room doc
    tx.update(roomRef, {
      phase: "answering",
      imposterId: null,
      round: {
        roundNumber: nextRound,
        startedAt: FieldValue.serverTimestamp(),
        deadline: Timestamp.fromMillis(
          Date.now() + room.settings.answerTimeLimitSec * 1000
        ),
        publicPrompt: null,
        totalAnswers: 0,
        totalVotes: 0,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
});
```

**Key guarantees:**

- Transactions are atomic — either everything succeeds or nothing changes
- If two requests race, one will retry automatically (Firestore transaction semantics)
- Guard conditions are checked inside the transaction, so stale reads cannot cause invalid transitions
- Imposter identity is stored in a server-only `secrets` subcollection that clients cannot read

### Answer + vote submission (client-side writes)

These go directly to Firestore (not via Cloud Function) for lower latency. Conflict resolution is handled by security rules:

- The composite doc ID `{round}_{playerId}` prevents cross-round collisions
- The `!exists(...)` check prevents double-submission within a round
- The `phase == "answering"` / `phase == "voting"` check prevents out-of-phase writes
- Firestore's built-in document-level locking ensures atomicity for simultaneous writes

---

# 12. Disconnection & Recovery

## V1 Strategy: Keep It Simple

For V1, we **do not** implement a full presence system (RTDB + sync functions + host promotion). That's a lot of infrastructure for a problem that rarely blocks the core game loop.

### What we handle in V1

| Scenario | V1 behavior |
|---|---|
| Player refreshes the page | Anonymous Auth persists (IndexedDB). Client re-subscribes to room, renders current phase. No data loss. |
| Player closes tab during `answering` | Their answer slot stays empty. Game continues — deadline still enforced by server. |
| Player closes tab during `voting` | Their vote isn't counted. Scoring proceeds with available votes. |
| Player closes tab during `lobby` | They're still in the `players` subcollection. Host can see them listed. |
| Host closes tab | Game pauses until host returns. Auth persists, so refreshing the URL works. |
| All players leave | Room expires after TTL (2 hours). Cleaned up by scheduled function. |

### What we defer to V2

| Feature | Why defer |
|---|---|
| RTDB presence (`onDisconnect`) | Complex sync layer between RTDB → Firestore. Not needed for a playable V1. |
| `isConnected` / `lastSeen` fields | Requires presence system. Adds write churn to player docs. |
| Automatic host promotion | Requires detecting "host is truly gone" vs "host refreshed." Needs presence. |
| Kicking disconnected players | Host can't tell who disconnected without presence. Manual kick from lobby is fine for V1. |

### Reconnection (works out of the box in V1)

- Firebase Anonymous Auth persists across refreshes and tab reopens (token stored in IndexedDB)
- On reconnect, the client reads the current room state and renders the correct phase
- No special "rejoin" flow needed — the player's UID is already in the `players` subcollection

---

# 13. Timing & Countdown Strategy

### Problem

Client clocks cannot be trusted. A player could manipulate their system clock to get extra answering time.

### Solution: Server-Authoritative Deadlines

1. When a timed phase begins, the Cloud Function writes a `deadline` (Firestore `Timestamp`) to the room document
2. The client reads `deadline` from the Firestore snapshot and displays an approximate countdown
3. The **server** enforces the actual deadline — even if a client's clock is wrong, the phase transitions when the server says so

### Client countdown display

The client computes `remaining ≈ deadline.toMillis() - Date.now()` and shows "~X seconds left." If this is off by a second due to clock skew, that's fine — it's a party game, not a stock exchange. The server is the authority on when the phase actually transitions.

### Server-side deadline enforcement

```ts
// Scheduled function: runs every 15 seconds, checks active rooms only
exports.enforceDeadlines = onSchedule("every 15 seconds", async () => {
  const now = Timestamp.now();
  const expiredRooms = await db
    .collection("rooms")
    .where("phase", "in", ["answering", "voting"])
    .where("round.deadline", "<=", now)
    .get();

  for (const doc of expiredRooms.docs) {
    await advancePhase(doc.id);
  }
});
```

### Why not rely on the client to transition?

- A malicious client could simply not trigger the transition
- If the host disconnects, no client would advance the phase
- Server-side enforcement guarantees the game always progresses

### Indexing

This query requires a **composite index** on the `rooms` collection:

- `phase` (equality) + `round.deadline` (ascending)

This must be created in the Firebase Console or via `firestore.indexes.json`.

---

# 14. Performance Constraints & Limits

## Room Limits

| Constraint | Value | Reason |
|---|---|---|
| Max players per room | 20 | UX + Firestore query simplicity |
| Answer max length | 500 characters | Prevents abuse, keeps UI clean |
| Player name max length | 20 characters | Display consistency |
| Room code format | 6 uppercase alphanumeric | ~2.1 billion combinations, avoids ambiguous chars |
| Room TTL | 2 hours | Scheduled cleanup prevents stale data |

## Firestore Cost Optimization

| Strategy | Impact |
|---|---|
| Players in subcollection (not map on room doc) | Player joins and score updates don't re-trigger room snapshot for all clients |
| Conditional listeners (only attach when needed) | Reduces reads by ~40% per game session |
| Per-round answer/vote doc IDs | No need to clear subcollections between rounds |
| `totalAnswers` / `totalVotes` counter on room doc | Clients know submission progress without reading answer subcollection |
| Batch writes in Cloud Functions | Reduces write operations |
| Room cleanup after TTL | Prevents unbounded storage growth |

## Firestore Read Estimates (per game, 6 players, 5 rounds)

| Source | Estimated reads |
|---|---|
| Room doc snapshots (~25 phase changes × 6 clients) | ~150 |
| Player collection snapshots (~10 updates × 6 clients) | ~60 |
| Prompt reads (6 per round × 5 rounds) | ~30 |
| Answer reads (6 answers × 5 rounds × 6 clients) | ~180 |
| Vote reads (6 votes × 5 rounds × 6 clients) | ~180 |
| **Total** | **~600 reads per game** |

At 50,000 free reads/day, that's **~83 games/day on the free tier**.

---

# 15. UI Architecture

## Component Hierarchy

```
RoomProvider (context: room state, players, auth)
  └── RoomPage
        ├── LobbyView
        │     ├── PlayerList
        │     ├── RoomCodeDisplay
        │     ├── SettingsPanel (host only)
        │     └── StartButton (host only)
        ├── AnsweringView
        │     ├── PromptCard
        │     ├── AnswerInput
        │     ├── CountdownTimer
        │     └── SubmittedOverlay
        ├── RevealedView
        │     ├── SharedPromptBanner
        │     ├── AnswerGrid
        │     └── AdvanceButton (host only)
        ├── VotingView
        │     ├── AnswerGrid (with vote buttons)
        │     ├── CountdownTimer
        │     └── VoteConfirmation
        ├── ScoringView
        │     ├── ScoreBoard
        │     ├── ImposterReveal
        │     └── NextRoundButton (host only)
        └── FinishedView
              ├── FinalScoreBoard
              └── PlayAgainButton
```

## Reusable Primitives

Located in `src/components/`:

| Component | Purpose |
|---|---|
| `Card` | Glass-morphism container with title, subtitle, and content slots |
| `Button` | Primary, secondary, danger, and ghost variants |
| `CountdownTimer` | Displays remaining time from a Firestore `deadline` timestamp |
| `PlayerAvatar` | Colored circle with initials |
| `Modal` | Confirmation dialogs, error messages |
| `Toast` | Ephemeral success/error notifications |
| `LoadingSpinner` | Consistent loading state across all views |
| `Input` | Styled text input with character counter and validation |

## Phase-Based Rendering

```tsx
function RoomPage() {
  const { room } = useRoom();

  switch (room.phase) {
    case "lobby":     return <LobbyView />;
    case "prompting": return <LoadingSpinner label="Assigning prompts..." />;
    case "answering": return <AnsweringView />;
    case "revealed":  return <RevealedView />;
    case "voting":    return <VotingView />;
    case "scoring":   return <ScoringView />;
    case "finished":  return <FinishedView />;
  }
}
```

The UI is a **pure function of server state**. There is no client-side phase tracking.

---

# 16. Authentication & Session Management

## Anonymous Auth

PlotTwist uses **Firebase Anonymous Authentication** — no email, no password, no OAuth.

### Why?

- Party games need zero-friction onboarding
- A player should be able to join in < 5 seconds
- Anonymous Auth still provides a stable UID for security rules

### Flow

1. On first visit, the client calls `signInAnonymously()`
2. Firebase returns a UID — stored in IndexedDB, persists across refreshes
3. This UID is used as the player's identity in all Firestore reads/writes
4. If the user clears browser data, they get a new UID (and appear as a new player)

### Limitations & Mitigations

| Limitation | Mitigation |
|---|---|
| No account recovery | Acceptable for ephemeral party games |
| UID lost on browser data clear | Player can rejoin with a new name |
| No cross-device identity | Not needed for the current use case |
| Potential UID accumulation | Firebase auto-cleans anonymous accounts after 30 days |

---

# 17. Extensibility

## Adding a New Game Mode

To add a new game (e.g., "Imposter"):

### 1. Create the route

```
src/app/games/imposter/
  page.tsx
  create/page.tsx
  join/page.tsx
  room/[roomCode]/
    page.tsx
    components/
```

### 2. Define the game config

```ts
// src/lib/games/imposter/config.ts
export const imposterConfig: GameConfig = {
  mode: "imposter",
  displayName: "Imposter",
  minPlayers: 4,
  maxPlayers: 12,
  phases: ["lobby", "prompting", "discussing", "voting", "scoring"],
  defaultSettings: {
    maxPlayers: 12,
    totalRounds: 3,
  },
};
```

### 3. Implement game-specific Cloud Functions

Each game mode registers its own callable functions:

- `imposter-startRound`
- `imposter-advancePhase`
- `imposter-calculateScores`

### 4. Reuse the shared engine

The following are game-agnostic and require no changes:

- Room creation / joining
- Real-time listeners + `RoomProvider`
- Manual host-driven phase progression
- UI primitives (Card, Button, etc.)
- Auth flow
- Deployment pipeline

### Data model extension

If a new game needs additional fields, extend the `Room` type with a discriminated union:

```ts
type Room = BaseRoom & (GuessTheLiarState | ImposterState);

type GuessTheLiarState = {
  mode: "guess-the-liar";
  // Guess the Liar specific fields
};

type ImposterState = {
  mode: "imposter";
  // Imposter specific fields
};
```

This keeps the shared engine generic while allowing game-specific data.

---

# 18. Testing Strategy

## Unit Tests

| What | Tool | Scope |
|---|---|---|
| TypeScript types & validators | Vitest | Type guards, data sanitization functions |
| Phase transition logic | Vitest | State machine validation (given phase X, can transition to Y?) |
| Score calculation | Vitest | Given votes + imposter ID, are scores correct? |

## Integration Tests

| What | Tool | Scope |
|---|---|---|
| Cloud Functions | Firebase Emulator + Vitest | Full function execution against emulated Firestore |
| Security rules | `@firebase/rules-unit-testing` | Verify that unauthorized reads/writes are rejected |
| Manual phase progression | Firebase Emulator | Verify host-controlled transitions and no timer-triggered transitions |

## End-to-End Tests

| What | Tool | Scope |
|---|---|---|
| Full game flow | Playwright | Two browser contexts simulate host + player through a complete game |
| Disconnection scenarios | Playwright | Close one tab mid-game, verify recovery |
| Race conditions | Playwright | Simultaneous answer submissions |

## Testing Environment

- **Firebase Emulator Suite** for all backend tests — no production data touched
- **CI runs all tests** before merge (GitHub Actions)
- **Preview deploys on Vercel** for manual QA on pull requests

---

# 19. Observability & Debugging

## Logging

| Layer | Tool | What's logged |
|---|---|---|
| Cloud Functions | Firebase Functions logger | Phase transitions, errors, transaction retries |
| Client | Browser console (structured) | Snapshot updates, auth state changes, listener errors |
| Security rules | Firestore audit log | Denied reads/writes (visible in Firebase Console) |

## Error Handling

| Error type | Client behavior | Server behavior |
|---|---|---|
| Firestore write rejected | Toast with user-friendly message | Log the attempted write + reason |
| Cloud Function throws | Toast with error message | Log full error + stack trace |
| Listener disconnected | Show "Reconnecting..." banner | N/A (client-side) |
| Network offline | Show offline indicator, disable inputs | N/A |
| Room not found | Redirect to join page with error message | N/A |
| Room full | Show "Room is full" message | Cloud Function rejects join |

## Debugging Multiplayer Issues

1. **Firebase Emulator UI** — inspect Firestore documents, function logs, and auth state locally
2. **Room state inspector** — a dev-only component that renders the raw room JSON (hidden behind `?debug=true` query param in non-production)
3. **Cloud Function logs** — filterable by room code in Google Cloud Console
4. **Firestore history** — use the Firebase Console to view document change history

---

# 20. Deployment Strategy

## Environments

| Environment | Purpose | URL |
|---|---|---|
| Local | Development | `localhost:3000` + Firebase Emulator |
| Preview | PR review | Auto-generated Vercel URL per PR |
| Production | Live | `playplottwist.com` |

## CI Pipeline (GitHub Actions)

```yaml
on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit          # Type checking
      - run: npm run test              # Unit + integration tests
      - run: npm run build             # Ensure production build succeeds
```

## Firebase Deployment

- Cloud Functions and Firestore rules are deployed via `firebase deploy` in a separate CI step
- Production deploys require manual approval (GitHub environment protection rules)

## Dependency Stability

- `package-lock.json` is committed and never regenerated carelessly
- Node version pinned in `.nvmrc`
- Dependencies updated intentionally — never `npm audit fix --force`
- Dependabot configured for security-only updates

---

# 21. V2 Roadmap

Features explicitly deferred from V1 to keep scope tight:

| Feature | Why it's V2 | What's needed |
|---|---|---|
| **RTDB Presence System** | Complex sync layer (RTDB → Firestore). V1 works fine with refresh-based recovery. | `onDisconnect()` handlers, Cloud Function to sync `isConnected`/`lastSeen` to player docs |
| **Automatic Host Promotion** | Requires reliable presence detection to distinguish "host crashed" from "host refreshed." | Presence system + 60 s timeout + Cloud Function to reassign `hostId` |
| **Player Kick (online/offline detection)** | Without presence, host can't tell who's disconnected vs. idle. Manual lobby management is fine for V1. | Presence system + UI for host to remove players |
| **Rate Limiting / Anti-Abuse** | Party games among friends don't need this initially. | Cloud Function middleware or Firebase App Check |
| **Analytics & Metrics** | Not needed until there are real users. | Firebase Analytics or custom event logging |
| **Room Archival** | Currently rooms just expire. Saving game history for replays/stats is a V2 feature. | Separate `archivedRooms` collection + Cloud Function on room finish |
| **Spectator Mode** | Nice-to-have for watching without playing. | Read-only role in players subcollection + UI variant |
