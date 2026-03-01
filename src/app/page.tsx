export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          PlotTwist
        </h1>
        <p className="mt-3 text-zinc-600">
          Local multiplayer party game prototype. Start by creating a room or joining
          an existing one.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            className="rounded-lg bg-zinc-900 px-4 py-3 text-center font-medium text-white hover:bg-zinc-700"
            href="/games/guess-the-liar/create"
          >
            Create Room
          </a>
          <a
            className="rounded-lg border border-zinc-300 px-4 py-3 text-center font-medium text-zinc-900 hover:bg-zinc-50"
            href="/games/guess-the-liar/join"
          >
            Join Room
          </a>
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          Emulator-first mode is enabled. Use Firebase Emulator UI to inspect room data.
        </p>
      </main>
    </div>
  );
}
