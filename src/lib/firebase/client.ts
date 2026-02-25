"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { getFirebaseWebConfig } from "./config";

const app = getApps().length > 0 ? getApp() : initializeApp(getFirebaseWebConfig());

export const firebaseApp = app;
export const auth = getAuth(app);
export const db = getFirestore(app);

// TODO: Add Firebase Functions client in a future increment.
