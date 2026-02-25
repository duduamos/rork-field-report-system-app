import { createTRPCRouter } from "./create-context";
import { reportsRouter } from "./routes/reports";

export const appRouter = createTRPCRouter({
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
