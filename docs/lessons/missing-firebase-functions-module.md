# Missing `firebase-functions` Module

## What happened
Functions load failed with:
`Error: Cannot find module 'firebase-functions'`

## Why it happened
Dependencies were not installed in the `functions/` workspace yet.

## How we fixed it
1. Added required deps in `functions/package.json`:
   - `firebase-functions`
   - `firebase-admin`
2. Installed them in `functions/`:
```bash
cd functions && npm install
```

## How to verify
- Re-run emulators.
- No missing-module error appears.
- Function definitions load successfully.

## ELI5
The code asked for a toolbox (`firebase-functions`), but the toolbox was not in the room. We installed it.

## Prevention checklist
- After dependency changes, run install in `functions/`.
- Commit `functions/package-lock.json` with dependency updates.
