# Increment 6 - Create + Join (Complete)

## Scope

Increment 6 shipped in multiple small batches (max 3 files per batch) to keep each step testable and easy to review.

### Batch 1 (Completed)

Files:
1. `functions/index.js`
2. `firestore.rules`
3. `src/lib/firebase/client.ts`

What was done:
1. Added callable Functions `createRoom` and `joinRoom`.
2. Added room/player read rules and blocked direct client writes for those paths.
3. Connected client-side Firebase Functions emulator and exported `functionsClient`.

### Batch 2 (Completed)

Files:
1. `src/app/games/guess-the-liar/create/page.tsx`
2. `src/app/games/guess-the-liar/join/page.tsx`
3. `docs/increment-6.md`

What was done:
1. Added create-room page with callable `createRoom` submit flow.
2. Added join-room page with callable `joinRoom` submit flow.
3. Added user-friendly error mapping (not-found, invalid-argument, failed-precondition, unauthenticated).
4. Room code is normalized to uppercase and validated as 6 letters.
5. On success, both pages redirect to `/games/guess-the-liar/room/{roomCode}`.

### Batch 3 (Completed)

Files:
1. `src/app/games/guess-the-liar/room/[roomCode]/page.tsx`
2. `docs/increment-6.md`

What was done:
1. Added dynamic room route so create/join redirects no longer land on 404.
2. Added minimal room shell UI that confirms the room code and clarifies lobby is the next step.
3. Confirmed root cause for click-time error: callable succeeded, but room page path was missing.

### Batch 4 (Completed)

Files:
1. `src/app/page.tsx`
2. `docs/increment-6.md`

What was done:
1. Replaced default Next.js starter home screen with game entry navigation.
2. Added direct links to:
   - `/games/guess-the-liar/create`
   - `/games/guess-the-liar/join`
3. Made manual test flow easier by exposing create/join routes from `/`.

### Batch 5 (Completed)

Files:
1. `functions/index.js`
2. `src/lib/types.ts`
3. `docs/increment-6.md`

What was done:
1. Removed timer settings from created room docs (`answerTimeLimitSec`, `votingTimeLimitSec`).
2. Updated shared `RoomSettings` type to remove timer fields.
3. Kept progression explicitly manual/host-driven with no timer configuration in room settings.

## Decisions Locked In

1. Room code format: 6 uppercase letters.
2. Max players: 12.
3. Duplicate join behavior: idempotent success.
4. No timer-based phase transitions; progression remains manual/host-driven.
5. Room settings do not include timer fields.

## Execution Order

1. User opens `/games/guess-the-liar/create` or `/games/guess-the-liar/join`.
2. Auth bootstrap ensures an authenticated user exists.
3. Form validates inputs on the client.
4. Client calls callable Function (`createRoom` or `joinRoom`) through the Functions emulator.
5. Function validates auth + payload, then writes room/player docs using Admin SDK transactions.
6. Client redirects to `/games/guess-the-liar/room/{roomCode}`.
7. Room shell route renders and confirms room code.

## Manual Test Steps

1. Start emulators:
   - `firebase emulators:start --only auth,firestore,functions`
2. Start app:
   - `npm run dev`
3. Open:
   - `http://localhost:3000`
4. Click **Create Room**, enter a name, submit.
5. Confirm redirect to:
   - `/games/guess-the-liar/room/{ROOM_CODE}`
6. Open another tab/window, go to **Join Room**, enter a different name and same room code, submit.
7. In Emulator UI (`http://127.0.0.1:4000/firestore`), verify:
   - `rooms/{roomCode}` exists
   - `rooms/{roomCode}/players/{uid}` has host + joined player docs

## ELI5

We finished the "make room" and "join room" buttons and connected them to the backend doorman.
If you type bad inputs, you get clear human messages.
If everything is valid, you are sent to the room URL, and now that room URL has a page.

## Outcome

Increment 6 goals are complete:

1. Backend create/join callable Functions are implemented and wired.
2. Create/join pages call backend and handle common errors clearly.
3. Redirect target room route exists (no 404 on success).
4. Room/player writes are backend-controlled by rules.
5. No game timers were introduced.

## Next Increment Candidates

1. Start Increment 7: room real-time subscriptions + lobby UI.
2. Keep manual/host-driven progression (no deadline timers).
