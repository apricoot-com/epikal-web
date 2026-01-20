import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for React components
 * 
 * Provides hooks and functions for auth:
 * - useSession() - get current session
 * - signIn.email() - sign in with email/password
 * - signUp.email() - create account
 * - signOut() - sign out
 */
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { useSession, signIn, signUp, signOut } = authClient;
