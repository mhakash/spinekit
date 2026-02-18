/**
 * Authentication Routes
 */

import { Hono } from "hono";
import type { Auth } from "../auth/auth";

export function createAuthRoutes(auth: Auth) {
  const app = new Hono();

  app.on(["POST", "GET"], "/*", async (c) => {
    return auth.handler(c.req.raw);
  });

  return app;
}
