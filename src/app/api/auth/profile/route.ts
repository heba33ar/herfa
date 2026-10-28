import { currentDbUser, destroySession } from "@/lib/server/auth";
import { writeDb } from "@/lib/server/db";
import { toPublicUser } from "@/lib/server/schema";

/** Updates the signed-in user's own profile. Roles are not editable here. */
export async function PATCH(request: Request) {
  const me = await currentDbUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "bad_request" }, { status: 400 });

  const updated = await writeDb((db) => {
    const user = db.users.find((u) => u.id === me.id);
    if (!user) return null;

    if (typeof body.name === "string" && body.name.trim()) user.name = body.name.trim();
    if (typeof body.phone === "string") user.phone = body.phone.trim() || undefined;
    if (typeof body.townId === "string") user.townId = body.townId || undefined;
    if (body.locale === "ar" || body.locale === "he" || body.locale === "en") {
      user.locale = body.locale;
    }
    // Only the withdrawable consents are editable. Spreading the body here
    // would let someone clear their own terms/privacy acceptance record.
    if (body.consents && typeof body.consents === "object") {
      const incoming = body.consents as Record<string, unknown>;
      for (const key of ["marketingEmail", "marketingWhatsapp", "publishContent"] as const) {
        if (key in incoming) user.consents[key] = Boolean(incoming[key]);
      }
    }
    return user;
  });

  if (!updated) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ user: toPublicUser(updated) });
}

/** Account deletion. Removes the user, their sessions and the cookie. */
export async function DELETE() {
  const me = await currentDbUser();
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });

  const removed = await writeDb((db) => {
    // Refuse to delete the last admin — doing so locks everyone out of
    // /admin with no way back short of editing the database by hand.
    if (me.roles.includes("admin")) {
      const admins = db.users.filter((u) => u.roles.includes("admin"));
      if (admins.length <= 1) return false;
    }
    db.users = db.users.filter((u) => u.id !== me.id);
    db.sessions = db.sessions.filter((s) => s.userId !== me.id);
    return true;
  });

  if (!removed) {
    return Response.json({ error: "last_admin" }, { status: 409 });
  }

  // Drop the cookie too, or the browser keeps presenting a dead session.
  await destroySession();
  return Response.json({ ok: true });
}
