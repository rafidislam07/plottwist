type RoomPageProps = {
  params: Promise<{
    roomCode: string;
  }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomCode } = await params;
  const normalizedRoomCode = roomCode.toUpperCase();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Room {normalizedRoomCode}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Create and join flows are now wired. Real-time lobby UI lands in the next increment.
        </p>

        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <p>Next step preview:</p>
          <p className="mt-1">
            This page will subscribe to room and player docs and render the lobby state.
          </p>
        </div>
      </section>
    </main>
  );
}
