# Next.js Env Vars: Static vs Dynamic Access

## What happened

We saw a runtime error in the browser:

`Missing required Firebase env var: NEXT_PUBLIC_FIREBASE_API_KEY`

The `.env.local` file was correct, but client code still failed.

## Root cause

In client-reachable code, we used dynamic lookup:

```ts
process.env[key]
```

Next.js only inlines `NEXT_PUBLIC_*` env vars when access is static, like:

```ts
process.env.NEXT_PUBLIC_FIREBASE_API_KEY
```

With dynamic keys, bundling cannot safely replace the value, so the client gets `undefined`.

## Why this exists

- Security: only explicitly public vars (`NEXT_PUBLIC_*`) can go to browser code.
- Build optimization: static references can be inlined and optimized at build time.
- Predictability: client bundle values are compile-time constants, not runtime lookups.

## Wrong vs Right

Wrong (dynamic key):

```ts
function getRequiredEnv(key: string) {
  return process.env[key];
}
```

Right (static references passed into helper):

```ts
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const config = {
  apiKey: required(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  ),
};
```

## ELI5

Think of Next.js as printing your app into a booklet before users read it.

- Static env access is like saying: "Write this exact phone number on page 10."
- Dynamic env access is like saying: "Write whatever number is in box `key`."

The printer can only fill in exact page instructions, not vague ones.
So static works, dynamic does not.

## Rules for this project

1. In client-reachable code, never use `process.env[someKey]`.
2. Use static `process.env.NEXT_PUBLIC_*` references only.
3. Keep fail-fast validation, but validate static values (not dynamic lookups).
4. If an env error appears, also check for shell-exported empty vars overriding `.env.local`.
