# Room Players Load Error (Auth Race Condition)

## What happened
Room page could show an error like "could not load room players" on initial load.

## Why it happened
Firestore listeners started before auth user identity was ready. Rules then rejected access during that brief window.

## How we fixed it
In `useRoomStore`, we wait for `userId` before creating subscriptions to:
- `rooms/{roomCode}`
- `rooms/{roomCode}/players`

## How to verify
1. Refresh a room page directly.
2. Confirm no initial players-load error.
3. Confirm players list appears after auth is ready.

## ELI5
We tried to enter the room before getting our name tag. Now we wait for the name tag first.

## Prevention checklist
- Gate Firestore reads on auth readiness.
- Treat `auth loading` as a first-class UI state.
