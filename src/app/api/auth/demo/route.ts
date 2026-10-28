import { createSession } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { toPublicUser } from "@/lib/server/schema";

/**
 * One-click sign-in for the three seeded demo accounts — no password.
 *
 * This is a deliberate POC affordance so the platform can be shown without
 * typing Arabic emails on a phone. It is restricted to a fixed allowlist and
 * must be removed before any real launch.
 */
const DEMO_IDS = new Set(["u-buyer-1", "u-seller-1", "u-admin-1"]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const userId = String(body?.userId ?? "");

  if (!DEMO_IDS.has(userId)) {
    return Response.json({ error: "not_a_demo_account" }, { status: 403 });
  }

  const db = await readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return Response.json({ error: "not_found" }, { status: 404 });

  await createSession(user.id, new Date().toISOString());
  return Response.json({ user: toPublicUser(user) });
}
