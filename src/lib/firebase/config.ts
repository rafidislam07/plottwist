export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function required(
  name: string,
  value: string | undefined
): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required Firebase env var: ${name}`);
  }

  return value;
}

export function getFirebaseWebConfig(): FirebaseWebConfig {
  const apiKey = required(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  );

  const authDomain = required(
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  );

  const projectId = required(
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );

  const storageBucket = required(
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  );

  const messagingSenderId = required(
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  );

  const appId = required(
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}