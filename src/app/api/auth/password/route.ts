import { currentDbUser, hashPassword, verifyPassword } from "@/lib/server/auth";
import { writeDb } from "@/lib/server/db";

/** Changes the signed-in user's own password. */
export async function PATCH(request: Request) {
  const me = await currentDbUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "bad_request" }, { status: 400 });

  const current = String(body.currentPassword ?? "");
  const next = String(body.newPassword ?? "");

  if (next.length < 6) {
    return Response.json({ error: "password_too_short" }, { status: 400 });
  }
  if (!(await verifyPassword(current, me.passwordHash))) {
    return Response.json({ error: "wrong_password" }, { status: 401 });
  }

  const hash = await hashPassword(next);
  await writeDb((db) => {
    const user = db.users.find((u) => u.id === me.id);
    if (!user) return;
    user.passwordHash = hash;
    user.mustChangePassword = false;
  });

  return Response.json({ ok: true });
}
