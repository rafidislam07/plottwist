# Increment 7 - Room Real-Time + Lobby UI (Complete)

## Goal

Deliver a real-time lobby experience on the room route so players can see room state and membership updates live.

## Current Progress

### Batch 1 (Completed)

Files:
1. `src/features/guess-the-liar/room-store.ts`
2. `src/features/guess-the-liar/components/RoomScreen.tsx`
3. `src/app/games/guess-the-liar/room/[roomCode]/page.tsx`

What was done:
1. Added `useRoomStore(roomCode, userId)` with live Firestore subscriptions:
   - `rooms/{roomCode}`
   - `rooms/{roomCode}/players`
2. Replaced room placeholder with lobby UI:
   - room title + phase
   - player list
   - host badge
   - host-only start button placeholder (manual progression only)
3. Added loading, auth-required, error, and room-not-found states.
4. Fixed auth timing for listeners by waiting for `userId` before subscribing.

### Batch 2 (Completed)

Files:
1. `src/app/games/guess-the-liar/join/page.tsx`
2. `src/app/games/guess-the-liar/room/[roomCode]/page.tsx`
3. `src/features/guess-the-liar/components/RoomScreen.tsx`

What was done:
1. Added explicit rejoin indicator via `?rejoined=1` when same UID joins again.
2. Added room-screen banner explaining why player count did not increase on same-device rejoin.
3. Added room code copy button with visual feedback.

### Batch 3 (Completed)

Files:
1. `src/app/games/guess-the-liar/join/page.tsx`
2. `docs/increment-7.md`
3. `docs/ROADMAP.md`

What was done:
1. Added join-page auth preparation status so "slow join" is explained to the user.
2. Added dynamic button label while identity is being prepared.
3. Updated roadmap status to in-progress for Increment 7.

## Manual Verification

1. Start emulators:
   - `firebase emulators:start --only auth,firestore,functions`
2. Start app:
   - `npm run dev`
3. Create room in tab A and open room route.
4. Join with a different browser profile (or incognito) in tab B.
5. Verify player list updates live in tab A.
6. Rejoin from same profile and verify explanatory rejoin banner.
7. Verify room code copy button works.

## Decisions

1. No timer-based progression.
2. Start-round action remains placeholder until Increment 8.
3. Same UID rejoin is idempotent and explicitly explained in UI.

## ELI5

The room page is now a live scoreboard.
When someone joins, everyone sees updates automatically.
If the same device joins again, the app explains why headcount did not change.

## Outcome

1. Real-time room and player subscriptions are active on the lobby route.
2. Lobby UI shows player list, host badge, and host-gated start button placeholder.
3. Same-device idempotent rejoin is explicitly explained in UI.
4. Join-page loading state now explains identity preparation latency.
5. Increment 7 scope is complete with manual progression preserved (no timers).
