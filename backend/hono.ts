import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();
app.use("*", cors());
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/trpc",
    router: appRouter,
    createContext,
  }),
);
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running", ts: Date.now() });
});

export default app;
export const GET = (req: Request) => app.fetch(req);
export const POST = (req: Request) => app.fetch(req);
export const DELETE = (req: Request) => app.fetch(req);
export const PUT = (req: Request) => app.fetch(req);
export const PATCH = (req: Request) => app.fetch(req);