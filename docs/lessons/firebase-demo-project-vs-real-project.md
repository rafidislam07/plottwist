# Firebase Demo Project vs Real Project

## What happened
Running emulators while not authenticated and targeting a real project ID produced warnings like:
- unable to look up project number
- features may not work
- fake project behavior may be unexpected

## Why it happened
The local setup was pointing at a real Firebase project while the CLI session was not logged in. Emulator flows still tried to resolve production metadata.

## How we fixed it
1. Switched the default project to `demo-plottwist` in `.firebaserc`.
2. Used emulator-only startup: `firebase emulators:start --only auth,firestore,functions`.
3. Kept the workflow local-only for development.

## How to verify
- Startup logs include: `Detected demo project ID "demo-plottwist"`.
- Emulator UI shows local activity only.
- Non-emulated service access fails instead of silently touching production.

## ELI5
We stopped practicing in the real city and moved to a fake practice city.
That way, if we make mistakes, nothing real gets damaged.

## Prevention checklist
- Use a `demo-` project ID for local emulator work.
- Start only needed emulators.
- Avoid local testing against production project IDs.
