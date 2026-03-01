"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

import { getFirebaseWebConfig } from "./config";

const firebaseConfig = getFirebaseWebConfig();
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseApp = app;
export const auth = getAuth(app);
export const db = getFirestore(app);

const shouldUseEmulators =
  process.env.NODE_ENV !== "production" &&
  (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
    firebaseConfig.projectId.startsWith("demo-"));

const globalForFirebase = globalThis as typeof globalThis & {
  __plottwistFirebaseEmulatorsConnected?: boolean;
};

if (shouldUseEmulators && !globalForFirebase.__plottwistFirebaseEmulatorsConnected) {
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST ?? "127.0.0.1";
  const authPort = Number(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT ?? "9099");
  const firestorePort = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT ?? "8080");

  connectAuthEmulator(auth, `http://${host}:${authPort}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, host, firestorePort);

  globalForFirebase.__plottwistFirebaseEmulatorsConnected = true;
}
