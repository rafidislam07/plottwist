# Increment 4 - Types + Prompt Bank (Explained)

## TL;DR

Increment 4 established the shared game data contracts and first prompt dataset:

1. Added canonical multiplayer game types in `src/lib/types.ts`.
2. Added a reusable prompt bank in `src/features/guess-the-liar/prompts.ts`.
3. Kept the model aligned with architecture, including `round.publicPrompt` and round-scoped IDs.

No UI changes and no new dependencies in this increment.

---

## ELI5 Version

Think of the project like a board game factory:

1. `types.ts` is the official rulebook that says what every card and score sheet must look like.
2. `prompts.ts` is the first stack of question cards we can use in rounds.
3. By doing this now, future code can stop guessing shapes and just follow one rulebook.

---

## Goal

Create a single source of truth for game data shapes and provide enough prompt pairs to run early rounds safely.

---

## Non-Goals (Intentionally Not Done Yet)

1. No Cloud Functions changes.
2. No game room UI rendering changes.
3. No Firestore reads/writes added.

---

## Files Changed

1. `src/lib/types.ts`
2. `src/features/guess-the-liar/prompts.ts`

---

## What Each File Does

## 1) `src/lib/types.ts`

Defines canonical shared types used across upcoming increments:

1. Core enums/unions:
   - `GameMode`
   - `Phase`
2. Room-level types:
   - `RoomSettings`
   - `RoundMeta` (includes `publicPrompt: string | null`)
   - `Room`
3. Subcollection doc types:
   - `Player`
   - `PlayerPrompt`
   - `Answer`
   - `Vote`
   - `RoundSecret` (includes `generalQuestion`)
4. Utility ID type:
   - `RoundScopedDocId = \`${number}_${string}\``

## 2) `src/features/guess-the-liar/prompts.ts`

Defines prompt data contracts and starter dataset:

1. `PromptPair` type with:
   - `generalQuestion`
   - `imposterQuestion`
2. `GUESS_THE_LIAR_PROMPTS` array with 10 prompt pairs.

This is the source for future `startRound` prompt selection.

---

## Runtime / Usage Execution Order (Step by Step)

This increment is foundational data only, so usage order in future increments will be:

1. Feature or function imports types from `src/lib/types.ts` to type room/subcollection docs.
2. Round-start logic imports `GUESS_THE_LIAR_PROMPTS`.
3. One `PromptPair` is selected.
4. Players receive either `generalQuestion` or `imposterQuestion`.
5. Reveal phase can publish `round.publicPrompt` using type-safe `RoundMeta`.

Dependency flow:

`types.ts` -> used by room logic + Firestore helpers  
`prompts.ts` -> used by round creation logic

---

## Manual Test Steps

1. Run lint:
   - `npm run lint`
2. Verify both files exist:
   - `ls src/lib/types.ts src/features/guess-the-liar/prompts.ts`
3. Verify exports quickly:
   - `rg -n "export type Room|export type RoundMeta|export const GUESS_THE_LIAR_PROMPTS" src/lib/types.ts src/features/guess-the-liar/prompts.ts`
4. Confirm prompt bank size is at least 8:
   - count objects in `GUESS_THE_LIAR_PROMPTS` (current: 10)

Expected:

1. Lint passes.
2. Exports are present.
3. Prompt bank has 8+ pairs.

---

## Design Notes

1. Used Firestore `Timestamp` typing to match architecture and future backend integration.
2. Included `publicPrompt` and `generalQuestion` to stay aligned with reveal-phase architecture updates.
3. Kept prompt shape intentionally minimal to reduce migration risk in future increments.

---

## TODOs for Next Increment

1. Decide whether prompts need optional metadata (`category`, `difficulty`) before production balancing.
2. Use `RoundScopedDocId` in Firestore helper signatures once create/join/answer/vote logic lands.
3. Add runtime validation boundaries when data starts crossing client/server boundaries.
