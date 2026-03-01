# Node Version Mismatch in Functions Emulator

## What happened
Warning appeared:
- requested Node `22`
- host running Node `24`
- emulator used host Node

## Why it happened
Local shell Node version did not match `functions/package.json` engines requirement.

## How we fixed it
Preferred local fix:
```bash
nvm install 22
nvm use 22
node -v
```
Alternative project-level fix (later): align `engines.node` after compatibility validation.

## How to verify
- `node -v` prints a 22.x version in that shell.
- Emulator startup no longer shows mismatch warning.

## ELI5
The recipe says oven setting 22, but the oven was on 24. We matched the oven to the recipe.

## Prevention checklist
- Keep `.nvmrc`/shell version aligned with Functions engine.
- Start emulators from a shell already on the expected Node version.
