import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { db, initDb } from "../../db";

const SplitterItemSchema = z.object({
  type: z.enum(["1:4", "1:8", "1:16", "1:32"]),
  quantity: z.number(),
});

const CableItemSchema = z.object({
  type: z.enum(["12", "36", "72", "144", "288"]),
  quantity: z.number(),
});

const ReportSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  username: z.string(),
  technician_name: z.string(),
  report_type: z.enum(["fault", "work"]),
  street: z.string(),
  city: z.string(),
  map_number: z.string(),
  note: z.string(),
  images: z.array(z.string()),

  work_type: z.enum(["cabinet", "closure", "addition"]).optional(),
  cabinet_number: z.string().optional(),
  cabinet_location: z.string().optional(),
  cabinet_splitters: z.array(SplitterItemSchema).optional(),

  closure_size: z.enum(["small", "medium", "large"]).optional(),
  closure_cables: z.array(CableItemSchema).optional(),
  closure_welds: z.number().optional(),
  closure_splitters: z.array(SplitterItemSchema).optional(),
  closure_number: z.string().optional(),

  addition_action: z.enum(["cable_insert", "weld_add"]).optional(),
  addition_target: z.enum(["cabinet", "closure"]).optional(),
  addition_number: z.string().optional(),
  addition_for_cabinet: z.string().optional(),
  addition_welds: z.number().optional(),
  addition_cable_type: z.string().optional(),

  ticket: z.string().optional(),
  arrival_time: z.string().optional(),
  fault_type: z.enum(["empty", "cabinet_damage", "cable_replace", "broken_fiber", "infrastructure_fix"]).optional(),

  cabinet_damage_sub: z.enum(["broken_splitter", "cable_pulled", "broken_weld"]).optional(),
  fault_splitters: z.array(SplitterItemSchema).optional(),
  fault_welds: z.number().optional(),
  fault_openings: z.number().optional(),

  fiber_openings: z.number().optional(),
  fiber_welds: z.number().optional(),
  fiber_otdr: z.string().optional(),

  cable_openings: z.number().optional(),
  cable_welds: z.number().optional(),
  cable_otdr: z.string().optional(),
  cable_type: z.string().optional(),
  cable_length: z.string().optional(),
  cable_from: z.string().optional(),
  cable_to: z.string().optional(),

  infra_openings: z.number().optional(),
  infra_welds: z.number().optional(),
  infra_cable_opening: z.string().optional(),
  infra_cable_type: z.string().optional(),
});

type Report = z.infer<typeof ReportSchema>;

let dbReady = false;
async function ensureDb(): Promise<void> {
  if (!dbReady) {
    await initDb();
    dbReady = true;
  }
}

function rowToReport(row: Record<string, unknown>): Report {
  const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
  return data as Report;
}

export const reportsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    await ensureDb();
    const result = await db.execute(
      "SELECT data FROM reports ORDER BY created_at DESC"
    );
    const reports = result.rows.map((row) => rowToReport(row as Record<string, unknown>));
    console.log("[Reports API] getAll - returning", reports.length, "reports");
    return reports;
  }),

  getByUser: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      await ensureDb();
      const result = await db.execute({
        sql: "SELECT data FROM reports WHERE username = ? ORDER BY created_at DESC",
        args: [input.username],
      });
      const reports = result.rows.map((row) => rowToReport(row as Record<string, unknown>));
      console.log("[Reports API] getByUser", input.username, "-", reports.length, "reports");
      return reports;
    }),

  add: publicProcedure
    .input(ReportSchema)
    .mutation(async ({ input }) => {
      await ensureDb();
      const existing = await db.execute({
        sql: "SELECT id FROM reports WHERE id = ?",
        args: [input.id],
      });
      if (existing.rows.length === 0) {
        await db.execute({
          sql: "INSERT INTO reports (id, created_at, username, data) VALUES (?, ?, ?, ?)",
          args: [input.id, input.created_at, input.username, JSON.stringify(input)],
        });
        console.log("[Reports API] Added report:", input.id, "by", input.username);
      } else {
        console.log("[Reports API] Report already exists:", input.id);
      }
      return { success: true, id: input.id };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await ensureDb();
      await db.execute({
        sql: "DELETE FROM reports WHERE id = ?",
        args: [input.id],
      });
      console.log("[Reports API] Deleted report:", input.id);
      return { success: true };
    }),
});
