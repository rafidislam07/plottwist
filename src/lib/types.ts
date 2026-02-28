import type { Timestamp } from "firebase/firestore";

export type GameMode = "guess-the-liar" | "imposter";

export type Phase =
  | "lobby"
  | "prompting"
  | "answering"
  | "revealed"
  | "voting"
  | "scoring"
  | "finished";

export type RoomSettings = {
  maxPlayers: number;
  answerTimeLimitSec: number;
  votingTimeLimitSec: number;
  totalRounds: number;
};

export type RoundMeta = {
  roundNumber: number;
  startedAt: Timestamp;
  deadline: Timestamp;
  publicPrompt: string | null;
  totalAnswers: number;
  totalVotes: number;
};

export type Room = {
  roomCode: string;
  mode: GameMode;
  hostId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  phase: Phase;
  settings: RoomSettings;
  playerCount: number;
  round: RoundMeta | null;
  imposterId: string | null;
};

export type Player = {
  id: string;
  name: string;
  joinedAt: Timestamp;
  score: number;
};

export type PlayerPrompt = {
  playerId: string;
  question: string;
  roundNumber: number;
};

export type Answer = {
  playerId: string;
  text: string;
  submittedAt: Timestamp;
  roundNumber: number;
};

export type Vote = {
  voterId: string;
  suspectId: string;
  roundNumber: number;
  submittedAt: Timestamp;
};

export type RoundSecret = {
  imposterId: string;
  generalQuestion: string;
  roundNumber: number;
};

export type RoundScopedDocId = `${number}_${string}`;
