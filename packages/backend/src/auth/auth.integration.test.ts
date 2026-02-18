/**
 * Comprehensive Auth Integration Tests
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { Hono } from "hono";
import { SQLiteAdapter } from "../adapters/sqlite.adapter";
import { createAuth } from "./auth";
import { createAuthRoutes } from "../routes/auth.routes";

describe("Better Auth Integration", () => {
  const app = new Hono();
  const dbPath = "spinekit.test.db";
  let dbAdapter: SQLiteAdapter;
  let auth: ReturnType<typeof createAuth>;

  beforeAll(async () => {
    dbAdapter = new SQLiteAdapter(dbPath);
    await dbAdapter.connect();
    
    auth = createAuth(dbAdapter);
    app.route("/api/auth", createAuthRoutes(auth));
  });

  const timestamp = Date.now();
  const testUser = {
    email: `test-${timestamp}@spinekit.dev`,
    password: "Test123456!",
    name: "Test User",
  };

  let sessionToken: string | undefined;

  it("should sign up a new user", async () => {
    const response = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    expect(data.user.name).toBe(testUser.name);
    expect(data.token).toBeDefined();

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/better-auth\.session_token=([^;]+)/);
      if (match) {
        sessionToken = match[1];
      }
    }
  });

  it("should sign in with correct credentials", async () => {
    const response = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    expect(data.token).toBeDefined();

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/better-auth\.session_token=([^;]+)/);
      if (match) {
        sessionToken = match[1];
      }
    }
  });

  it("should reject sign in with wrong password", async () => {
    const response = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: "WrongPassword123!",
      }),
    });

    expect(response.status).toBe(401);
  });

  it("should get current session with valid token", async () => {
    expect(sessionToken).toBeDefined();

    const response = await app.request("/api/auth/get-session", {
      method: "GET",
      headers: {
        Cookie: `better-auth.session_token=${sessionToken}`,
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    expect(data.session).toBeDefined();
    expect(data.session.userId).toBe(data.user.id);
  });

  it("should return null user for invalid session", async () => {
    const response = await app.request("/api/auth/get-session", {
      method: "GET",
      headers: {
        Cookie: "better-auth.session_token=invalid-token",
      },
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(!data || data.user === null || data.user === undefined).toBe(true);
  });

  it("should prevent duplicate email registration", async () => {
    const response = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    expect(response.status).not.toBe(200);
  });
});
