import { randomUUID } from "node:crypto";
import { createSession, hashPassword, normaliseEmail } from "@/lib/server/auth";
import { writeDb } from "@/lib/server/db";
import { type DbUser, toPublicUser } from "@/lib/server/schema";
import { sendEmail } from "@/lib/server/email";
import { welcomeEmail } from "@/lib/server/templates";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "bad_request" }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!name || !email || password.length < 6) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const user: DbUser = {
    id: `u-${randomUUID().slice(0, 8)}`,
    name,
    email: normaliseEmail(email),
    phone: body.phone ? String(body.phone).trim() : undefined,
    townId: body.townId ? String(body.townId) : undefined,
    locale: body.locale === "he" || body.locale === "en" ? body.locale : "ar",
    roles: ["buyer"],
    consents: {
      terms: true,
      privacy: true,
      marketingEmail: Boolean(body.marketingEmail),
      marketingWhatsapp: false,
      publishContent: false,
    },
    subscription: "free",
    passwordHash: await hashPassword(password),
    createdAt: now,
  };

  // The uniqueness check lives inside the write so two registrations racing
  // across the scrypt await cannot both pass it and create a duplicate that
  // neither person can log into.
  const created = await writeDb((db) => {
    const clash = db.users.some(
      (u) => normaliseEmail(u.email) === normaliseEmail(user.email),
    );
    if (clash) return false;
    db.users.push(user);
    return true;
  });

  if (!created) {
    return Response.json({ error: "email_taken" }, { status: 409 });
  }

  await createSession(user.id, now);
  // Awaited deliberately: a serverless function stops background work the
  // moment it responds, so a fire-and-forget send would be dropped.
  const email_ = await sendEmail(welcomeEmail(user.name, user.email));

  return Response.json(
    { user: toPublicUser(user), email: { status: email_.status, provider: email_.provider } },
    { status: 201 },
  );
}
