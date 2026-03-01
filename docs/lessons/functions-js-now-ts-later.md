# Functions in JavaScript Now, TypeScript Later

## What happened
We had to choose between immediate TypeScript migration for Functions vs shipping core gameplay flow first.

## Why it happened
Full TS migration adds setup and refactor overhead during a phase where fast backend iteration was the priority.

## What we decided
1. Keep Cloud Functions in `functions/index.js` for increments 5-7.
2. Document TS migration as a planned follow-up after core loop stabilizes.
3. Keep shared frontend/domain types improving in parallel.

## How to verify
- Current backend entrypoint is JS and works with emulators.
- Roadmap/architecture docs explicitly track TS migration as deferred work.

## ELI5
We used the faster bike we already had to finish the road first; we can upgrade to a better bike after the road is stable.

## Prevention checklist
- Revisit migration when gameplay loop is stable.
- Do migration as a dedicated increment with tests.
