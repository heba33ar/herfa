import { createSession, findUserByEmail, verifyPassword } from "@/lib/server/auth";
import { toPublicUser } from "@/lib/server/schema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "bad_request" }, { status: 400 });

  const email = String(body.email ?? "");
  const password = String(body.password ?? "");

  const user = await findUserByEmail(email);
  // Same response either way so the endpoint does not confirm which emails exist.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await createSession(user.id, new Date().toISOString());
  return Response.json({ user: toPublicUser(user) });
}
