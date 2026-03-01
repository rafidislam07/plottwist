"use client";

import { useState } from "react";

import { useAuthUser } from "@/lib/firebase/use-auth-user";

import { useRoomStore } from "../room-store";

type RoomScreenProps = {
  roomCode: string;
  joinedAgainOnThisDevice?: boolean;
};

export function RoomScreen({
  roomCode,
  joinedAgainOnThisDevice = false,
}: RoomScreenProps) {
  const { user, loading: authLoading } = useAuthUser();
  const { room, players, loading: roomLoading, error } = useRoomStore(
    roomCode,
    user?.uid ?? null
  );
  const [copied, setCopied] = useState(false);

  async function handleCopyRoomCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  if (authLoading || roomLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Loading room...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">You must be signed in to view this room.</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm text-red-700">{error}</p>
        </section>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
        <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-900">Room Not Found</h1>
          <p className="mt-2 text-sm text-zinc-600">
            This room does not exist or is no longer available.
          </p>
        </section>
      </main>
    );
  }

  const isHost = room.hostId === user.uid;
  const canStartRound = isHost && players.length >= 3 && room.phase === "lobby";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Room {roomCode}</h1>
            <p className="mt-1 text-sm text-zinc-600">Phase: {room.phase}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">
              Lobby
            </span>
            <button
              type="button"
              onClick={handleCopyRoomCode}
              className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {copied ? "Copied" : "Copy room code"}
            </button>
          </div>
        </div>

        {joinedAgainOnThisDevice ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This device already joined the room earlier, so player count did not increase.
          </p>
        ) : null}

        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-800">Players ({players.length})</p>
          <ul className="mt-3 space-y-2">
            {players.map((player) => {
              const playerIsHost = player.id === room.hostId;

              return (
                <li
                  key={player.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2"
                >
                  <span className="text-sm text-zinc-900">{player.name}</span>
                  {playerIsHost ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Host
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-6">
          {isHost ? (
            <button
              type="button"
              disabled={!canStartRound}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {players.length < 3
                ? "Start round (need at least 3 players)"
                : "Start round (coming next increment)"}
            </button>
          ) : (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              Waiting for host to start the round.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
