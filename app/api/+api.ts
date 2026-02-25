import app from "@/backend/hono";

const handler = async (req: Request) => app.fetch(req);

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
export const PUT = handler;
export const PATCH = handler;
