/* eslint-disable @typescript-eslint/no-require-imports */
const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

initializeApp();

const db = getFirestore();

const MAX_ROOM_CODE_ATTEMPTS = 15;
const ROOM_CODE_LENGTH = 6;
const DEFAULT_MAX_PLAYERS = 12;
const DEFAULT_TOTAL_ROUNDS = 5;

function requireUid(request) {
  const uid = request.auth && request.auth.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  return uid;
}

function parseName(data) {
  const name = data && typeof data.name === "string" ? data.name.trim() : "";

  if (!name) {
    throw new HttpsError("invalid-argument", "Player name is required.");
  }

  if (name.length > 30) {
    throw new HttpsError(
      "invalid-argument",
      "Player name must be at most 30 characters."
    );
  }

  return name;
}

function parseRoomCode(data) {
  const raw = data && typeof data.roomCode === "string" ? data.roomCode : "";
  const roomCode = raw.trim().toUpperCase();

  if (!/^[A-Z]{6}$/.test(roomCode)) {
    throw new HttpsError(
      "invalid-argument",
      "Room code must be exactly 6 uppercase letters."
    );
  }

  return roomCode;
}

function randomRoomCode(length) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";

  for (let index = 0; index < length; index += 1) {
    const next = Math.floor(Math.random() * alphabet.length);
    code += alphabet[next];
  }

  return code;
}

async function createRoomWithUniqueCode(roomDoc, hostDoc) {
  for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt += 1) {
    const roomCode = randomRoomCode(ROOM_CODE_LENGTH);
    const roomRef = db.collection("rooms").doc(roomCode);
    const hostRef = roomRef.collection("players").doc(hostDoc.id);

    try {
      await db.runTransaction(async (transaction) => {
        const roomSnapshot = await transaction.get(roomRef);
        if (roomSnapshot.exists) {
          throw new Error("room-code-conflict");
        }

        transaction.create(roomRef, {
          ...roomDoc,
          roomCode,
        });
        transaction.create(hostRef, hostDoc);
      });

      return roomCode;
    } catch (error) {
      if (error instanceof Error && error.message === "room-code-conflict") {
        continue;
      }

      throw error;
    }
  }

  throw new HttpsError(
    "resource-exhausted",
    "Unable to allocate a unique room code. Please retry."
  );
}

exports.createRoom = onCall(async (request) => {
  const uid = requireUid(request);
  const name = parseName(request.data);

  const now = FieldValue.serverTimestamp();
  const roomDoc = {
    mode: "guess-the-liar",
    hostId: uid,
    createdAt: now,
    updatedAt: now,
    phase: "lobby",
    settings: {
      maxPlayers: DEFAULT_MAX_PLAYERS,
      totalRounds: DEFAULT_TOTAL_ROUNDS,
    },
    playerCount: 1,
    round: null,
    imposterId: null,
  };

  const hostDoc = {
    id: uid,
    name,
    joinedAt: now,
    score: 0,
  };

  const roomCode = await createRoomWithUniqueCode(roomDoc, hostDoc);

  return {
    roomCode,
    maxPlayers: DEFAULT_MAX_PLAYERS,
  };
});

exports.joinRoom = onCall(async (request) => {
  const uid = requireUid(request);
  const name = parseName(request.data);
  const roomCode = parseRoomCode(request.data);

  const roomRef = db.collection("rooms").doc(roomCode);
  const playerRef = roomRef.collection("players").doc(uid);

  const result = await db.runTransaction(async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);
    if (!roomSnapshot.exists) {
      throw new HttpsError("not-found", "Room not found.");
    }

    const room = roomSnapshot.data();
    if (!room) {
      throw new HttpsError("internal", "Room data is unavailable.");
    }

    if (room.phase !== "lobby") {
      throw new HttpsError(
        "failed-precondition",
        "You can only join rooms that are in lobby phase."
      );
    }

    const playerSnapshot = await transaction.get(playerRef);
    if (playerSnapshot.exists) {
      return {
        roomCode,
        alreadyJoined: true,
        playerCount: typeof room.playerCount === "number" ? room.playerCount : 0,
      };
    }

    const playerCount = typeof room.playerCount === "number" ? room.playerCount : 0;
    const maxPlayers =
      room.settings && typeof room.settings.maxPlayers === "number"
        ? room.settings.maxPlayers
        : DEFAULT_MAX_PLAYERS;

    if (playerCount >= maxPlayers) {
      throw new HttpsError("failed-precondition", "Room is full.");
    }

    transaction.create(playerRef, {
      id: uid,
      name,
      joinedAt: FieldValue.serverTimestamp(),
      score: 0,
    });
    transaction.update(roomRef, {
      playerCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      roomCode,
      alreadyJoined: false,
      playerCount: playerCount + 1,
    };
  });

  return result;
});
