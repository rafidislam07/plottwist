"use client";

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "@/lib/firebase/client";
import type { Player, Room } from "@/lib/types";

type RoomStoreState = {
  room: Room | null;
  players: Player[];
  loading: boolean;
  error: string | null;
};

function asRoom(data: DocumentData): Room {
  return data as Room;
}

function asPlayer(data: DocumentData): Player {
  return data as Player;
}

export function useRoomStore(
  roomCode: string,
  userId: string | null
): RoomStoreState {
  const normalizedRoomCode = roomCode.toUpperCase();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomLoadedFor, setRoomLoadedFor] = useState<string | null>(null);
  const [playersLoadedFor, setPlayersLoadedFor] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{
    roomCode: string;
    userId: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const roomRef = doc(db, "rooms", normalizedRoomCode);
    const roomPlayersQuery = query(
      collection(db, "rooms", normalizedRoomCode, "players"),
      orderBy("joinedAt", "asc")
    );

    const unsubscribeRoom = onSnapshot(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setRoom(null);
          setRoomLoadedFor(normalizedRoomCode);
          setErrorState(null);
          return;
        }

        setRoom(asRoom(snapshot.data()));
        setRoomLoadedFor(normalizedRoomCode);
        setErrorState(null);
      },
      () => {
        setErrorState({
          roomCode: normalizedRoomCode,
          userId,
          message: "Could not load room state.",
        });
        setRoomLoadedFor(normalizedRoomCode);
      }
    );

    const unsubscribePlayers = onSnapshot(
      roomPlayersQuery,
      (snapshot) => {
        const nextPlayers = snapshot.docs.map((snapshotDoc) =>
          asPlayer(snapshotDoc.data())
        );
        setPlayers(nextPlayers);
        setPlayersLoadedFor(normalizedRoomCode);
        setErrorState(null);
      },
      () => {
        setErrorState({
          roomCode: normalizedRoomCode,
          userId,
          message: "Could not load room players.",
        });
        setPlayersLoadedFor(normalizedRoomCode);
      }
    );

    return () => {
      unsubscribeRoom();
      unsubscribePlayers();
    };
  }, [normalizedRoomCode, userId]);

  const activeError =
    errorState &&
    errorState.roomCode === normalizedRoomCode &&
    errorState.userId === userId
      ? errorState.message
      : null;

  if (!userId) {
    return {
      room,
      players,
      loading: true,
      error: null,
    };
  }

  return {
    room,
    players,
    loading:
      roomLoadedFor !== normalizedRoomCode ||
      playersLoadedFor !== normalizedRoomCode,
    error: activeError,
  };
}
