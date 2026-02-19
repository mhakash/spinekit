/**
 * Better-auth Configuration
 */

import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import type { DatabaseAdapter } from "../adapters/database.adapter";

export function createAuth(dbAdapter: DatabaseAdapter) {
  const db = (dbAdapter as any).getDatabase?.();
  
  if (!db) {
    throw new Error("Database adapter must implement getDatabase() method for Better Auth");
  }

  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET || "temp-secret-key-change-in-production-min-32-chars",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    database: db,
    trustedOrigins: ["*"],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update session every 24 hours
    },
    plugins: [
      bearer(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
