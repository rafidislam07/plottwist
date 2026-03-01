"use client";

import { httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { functionsClient } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/firebase/use-auth-user";

type JoinRoomResponse = {
  roomCode: string;
  alreadyJoined: boolean;
  playerCount: number;
};

function mapFunctionsError(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: string }).code)
    : "";

  if (code.includes("unauthenticated")) {
    return "Please wait for sign-in to finish and try again.";
  }

  if (code.includes("invalid-argument")) {
    return "Enter a valid name and 6-letter room code.";
  }

  if (code.includes("not-found")) {
    return "Room not found.";
  }

  if (code.includes("failed-precondition")) {
    return "Room is full or no longer joinable.";
  }

  return "Something went wrong while joining.";
}

export default function JoinRoomPage() {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return !loading && !!user && !isSubmitting;
  }, [isSubmitting, loading, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Please wait for sign-in to finish.");
      return;
    }

    const trimmedName = name.trim();
    const normalizedRoomCode = roomCode.trim().toUpperCase();

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    if (!/^[A-Z]{6}$/.test(normalizedRoomCode)) {
      setError("Room code must be 6 letters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const joinRoom = httpsCallable<
        { name: string; roomCode: string },
        JoinRoomResponse
      >(functionsClient, "joinRoom");

      const result = await joinRoom({
        name: trimmedName,
        roomCode: normalizedRoomCode,
      });

      if (!result.data.roomCode) {
        throw new Error("missing-room-code");
      }

      router.push(`/games/guess-the-liar/room/${result.data.roomCode}`);
    } catch (submitError) {
      setError(mapFunctionsError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Join Room</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Enter your name and room code to join.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-800" htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={30}
              autoComplete="nickname"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-blue-500 focus:ring-2"
              placeholder="Alex"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-800" htmlFor="room-code">
              Room code
            </label>
            <input
              id="room-code"
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono uppercase tracking-wide text-zinc-900 outline-none ring-blue-500 focus:ring-2"
              placeholder="ABCDEF"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Joining..." : "Join room"}
          </button>
        </form>
      </section>
    </main>
  );
}
