"use client";

import { useEffect } from "react";

import { ensureAnonymousUser } from "@/lib/firebase/auth";

export function AuthBootstrap() {
  useEffect(() => {
    void ensureAnonymousUser().catch((error: unknown) => {
      console.error("Anonymous auth bootstrap failed", error);
    });
  }, []);

  return null;
}
