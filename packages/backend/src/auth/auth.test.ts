/**
 * Authentication API Tests
 *
 * Run with: DB_PATH=spinekit.test.db PORT=3001 bun test src/auth/auth.test.ts
 * Make sure the test server is running on the specified port before running tests
 */

import { describe, it, expect, beforeAll } from "bun:test";

const BASE_URL = `http://localhost:${process.env.PORT || 3000}/api/auth`;

// Auth response types
interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
}

interface SessionResponse {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  } | null;
}

// Test user credentials - using timestamp to ensure unique emails per test run
const timestamp = Date.now();
const testUser = {
  email: `test${timestamp}@spinekit.dev`,
  password: "Test123456!",
  name: "Test User",
};

let authToken: string | undefined;

describe("Authentication API", () => {
  beforeAll(async () => {
    console.log(`Running auth tests against: ${BASE_URL}`);
    console.log(`Test user email: ${testUser.email}`);
  });

  it("should sign up a new user", async () => {
    const response = await fetch(`${BASE_URL}/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
      }),
    });

    const data = (await response.json()) as AuthResponse;
    console.log("Sign up response:", data);

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    expect(data.session).toBeDefined();

    // Extract session token from Set-Cookie header
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/better-auth\.session_token=([^;]+)/);
      if (match) {
        authToken = match[1];
      }
    }
  });

  it("should sign in with email and password", async () => {
    const response = await fetch(`${BASE_URL}/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const data = (await response.json()) as AuthResponse;
    console.log("Sign in response:", data);

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    expect(data.session).toBeDefined();

    // Update auth token
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/better-auth\.session_token=([^;]+)/);
      if (match) {
        authToken = match[1];
      }
    }
  });

  it("should get current session", async () => {
    expect(authToken).toBeDefined();

    const response = await fetch(`${BASE_URL}/get-session`, {
      method: "GET",
      headers: {
        Cookie: `better-auth.session_token=${authToken}`,
      },
    });

    const data = (await response.json()) as SessionResponse;
    console.log("Get session response:", data);

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe(testUser.email);
    expect(data.session).toBeDefined();
  });

  it("should fail with wrong password", async () => {
    const response = await fetch(`${BASE_URL}/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testUser.email,
        password: "WrongPassword123!",
      }),
    });

    expect(response.status).toBe(401);
  });

  it("should sign out", async () => {
    expect(authToken).toBeDefined();

    const response = await fetch(`${BASE_URL}/sign-out`, {
      method: "POST",
      headers: {
        Cookie: `better-auth.session_token=${authToken}`,
      },
    });

    console.log("Sign out response status:", response.status);

    expect(response.status).toBe(200);

    // Verify session is invalidated
    const sessionResponse = await fetch(`${BASE_URL}/get-session`, {
      method: "GET",
      headers: {
        Cookie: `better-auth.session_token=${authToken}`,
      },
    });

    const sessionData = (await sessionResponse.json()) as SessionResponse;
    expect(sessionData.user).toBeNull();
  });
});
