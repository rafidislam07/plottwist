# Emulator Port Collisions

## What happened
Emulators failed to start with messages like:
- port `4000` taken (UI)
- port `9099` taken (Auth)
- hub/logging moved to fallback ports

## Why it happened
A previous emulator run (or another local process) was still bound to those ports.

## How we fixed it
1. Stopped stale emulator processes.
2. Restarted emulators with explicit services: `firebase emulators:start --only auth,firestore,functions`.
3. Reused default ports once free.

## Useful commands
```bash
lsof -i :4000 -i :9099 -i :8080 -i :5001
pkill -f "firebase.*emulators"
```

## How to verify
- Startup completes without port-taken errors.
- UI is reachable at `http://127.0.0.1:4000`.

## ELI5
Two apps cannot sit in the same chair (port). We made the old app stand up first.

## Prevention checklist
- Shut down emulators cleanly when done.
- If startup fails, check ports before retrying.
