"use client";

import { httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { functionsClient } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/firebase/use-auth-user";

type CreateRoomResponse = {
  roomCode: string;
};

function mapFunctionsError(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: string }).code)
    : "";

  if (code.includes("unauthenticated")) {
    return "Please wait for sign-in to finish and try again.";
  }

  if (code.includes("invalid-argument")) {
    return "Please enter a valid name (1-30 characters).";
  }

  if (code.includes("resource-exhausted")) {
    return "Could not create a room right now. Please try again.";
  }

  return "Something went wrong while creating the room.";
}

export default function CreateRoomPage() {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [name, setName] = useState("");
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
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createRoom = httpsCallable<{ name: string }, CreateRoomResponse>(
        functionsClient,
        "createRoom"
      );
      const result = await createRoom({ name: trimmedName });
      const roomCode = result.data.roomCode;

      if (!roomCode) {
        throw new Error("missing-room-code");
      }

      router.push(`/games/guess-the-liar/room/${roomCode}`);
    } catch (submitError) {
      setError(mapFunctionsError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Create Room</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Enter your name to create a new game room.
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
            {isSubmitting ? "Creating..." : "Create room"}
          </button>
        </form>
      </section>
    </main>
  );
}
