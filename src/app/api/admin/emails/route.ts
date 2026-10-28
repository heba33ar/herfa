import { requireRole } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { emailProviderStatus } from "@/lib/server/email";

export async function GET() {
  if (!(await requireRole("admin"))) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const db = await readDb();
  return Response.json({ emails: db.emails, provider: emailProviderStatus() });
}
