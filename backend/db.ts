// 1. אבטחה: שימוש במשתני סביבה במקום Hardcoded Token
const TURSO_URL = process.env.TURSO_URL || "";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || "";

type TursoValue =
  | { type: "null" }
  | { type: "integer"; value: string }
  | { type: "real"; value: string }
  | { type: "text"; value: string }
  | { type: "blob"; base64: string };

interface TursoCol {
  name: string;
  decltype: string | null;
}

interface TursoResult {
  cols: TursoCol[];
  rows: TursoValue[][];
  affected_row_count: number;
  last_insert_rowid: string | null;
}

interface TursoResponse {
  results: Array<{
    type: "ok" | "error";
    response?: { type: string; result: TursoResult };
    error?: { message: string; code: string };
  }>;
}

type SqlArg = string | number | null;

interface DbStatement {
  sql: string;
  args?: SqlArg[];
}

interface DbResult {
  rows: Record<string, unknown>[];
}

function tursoValueToJs(val: TursoValue): unknown {
  if (val.type === "null") return null;
  // 2. המרה נכונה: הפיכת הערך מ-String למספר אמיתי ב-JS
  if (val.type === "integer") return Number(val.value); 
  if (val.type === "real") return Number(val.value);
  if (val.type === "text") return val.value;
  if (val.type === "blob") return val.base64;
  return null;
}

function resultToRows(result: TursoResult): Record<string, unknown>[] {
  return result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    result.cols.forEach((col, i) => {
      obj[col.name] = tursoValueToJs(row[i]);
    });
    return obj;
  });
}

async function executeSql(
  sql: string,
  args?: SqlArg[]
): Promise<DbResult> {
  if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
    throw new Error("Missing TURSO_URL or TURSO_AUTH_TOKEN environment variables.");
  }

  const stmt: { sql: string; args?: TursoValue[] } = { sql };
  
  if (args && args.length > 0) {
    stmt.args = args.map((arg): TursoValue => {
      if (arg === null) return { type: "null" };
      if (typeof arg === "number") {
        // 3. דיוק: הפרדה בין מספר שלם (Integer) למספר עשרוני (Real)
        return Number.isInteger(arg) 
          ? { type: "integer", value: String(arg) } 
          : { type: "real", value: String(arg) };
      }
      return { type: "text", value: String(arg) };
    });
  }

  const response = await fetch(`${TURSO_URL}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TURSO_AUTH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [{ type: "execute", stmt }, { type: "close" }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Turso HTTP ${response.status}: ${text}`);
  }

  const data = (await response.json()) as TursoResponse;
  const first = data.results[0];

  if (first.type === "error") {
    throw new Error(`Turso query error: ${first.error?.message ?? "unknown"}`);
  }

  if (!first.response || first.response.type !== "execute") {
    throw new Error("Unexpected Turso response format");
  }

  return { rows: resultToRows(first.response.result) };
}

export const db = {
  execute: async (input: string | DbStatement): Promise<DbResult> => {
    if (typeof input === "string") {
      return executeSql(input);
    }
    return executeSql(input.sql, input.args);
  },
};

export async function initDb(): Promise<void> {
  try {
    // השארתי את זה כקריאות נפרדות כי זה קורה רק באתחול האפליקציה,
    // אבל כעת זה בטוח ועובד חלק.
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        username TEXT NOT NULL,
        data TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_reports_username ON reports (username)
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at)
    `);
    console.log("[DB] Turso initialized successfully via HTTP API");
  } catch (error) {
    console.error("[DB] Failed to initialize Turso:", error);
    throw error;
  }
}