"use client";

import { signInAnonymously, type User } from "firebase/auth";

import { auth } from "./client";

export async function ensureAnonymousUser(): Promise<User> {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credential = await signInAnonymously(auth);
  return credential.user;
}

// TODO: Add a listener utility when we wire auth state into React components.
