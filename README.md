This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Local Firebase Emulator Mode (Recommended)

This project is configured for local-only Firebase development using the demo project ID `demo-plottwist`.

1. Install root dependencies:

```bash
npm install
```

2. Install Functions dependencies:

```bash
cd functions
npm install
cd ..
```

3. Start emulators:

```bash
firebase emulators:start --only auth,firestore,functions
```

4. In a second terminal, start the app:

```bash
npm run dev
```

5. Open Emulator UI:

```text
http://127.0.0.1:4000
```

### Troubleshooting

If ports are already taken, stop stale emulator processes and restart:

```bash
pkill -f "firebase emulators:start"
pkill -f "cloud-firestore-emulator"
```

If Functions fails with `Cannot find module 'firebase-functions'`, run:

```bash
cd functions && npm install
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
