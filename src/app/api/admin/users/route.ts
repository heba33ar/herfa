import { randomUUID } from "node:crypto";
import {
  findUserByEmail,
  generatePassword,
  hashPassword,
  normaliseEmail,
  requireRole,
} from "@/lib/server/auth";
import { readDb, writeDb } from "@/lib/server/db";
import { type DbUser, toPublicUser } from "@/lib/server/schema";
import { sendEmail } from "@/lib/server/email";
import { adminInviteEmail } from "@/lib/server/templates";
import type { Role } from "@/lib/types";

// admin_assistant is in the PRD's permission table but nothing in the app
// grants it any access yet, so it is not offered until it means something.
const ASSIGNABLE: Role[] = ["buyer", "seller", "admin"];

const ROLE_LABELS: Record<string, string> = {
  buyer: "مشترية",
  seller: "بائعة",
  admin: "مديرة",
};

export async function GET() {
  if (!(await requireRole("admin"))) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const db = await readDb();
  return Response.json({
    users: db.users
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toPublicUser),
  });
}

export async function POST(request: Request) {
  const admin = await requireRole("admin");
  if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "bad_request" }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const roles = Array.isArray(body.roles)
    ? (body.roles.filter((r: string) => ASSIGNABLE.includes(r as Role)) as Role[])
    : [];

  if (!name || !email) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  if (roles.length === 0) {
    return Response.json({ error: "no_roles" }, { status: 400 });
  }
  if (await findUserByEmail(email)) {
    return Response.json({ error: "email_taken" }, { status: 409 });
  }

  // The admin may supply a password; otherwise one is generated and emailed.
  const supplied = typeof body.password === "string" ? body.password.trim() : "";
  const password = supplied.length >= 6 ? supplied : generatePassword();

  const user: DbUser = {
    id: `u-${randomUUID().slice(0, 8)}`,
    name,
    email: normaliseEmail(email),
    phone: body.phone ? String(body.phone).trim() : undefined,
    townId: body.townId ? String(body.townId) : undefined,
    locale: body.locale === "he" || body.locale === "en" ? body.locale : "ar",
    roles,
    consents: {
      terms: true,
      privacy: true,
      marketingEmail: false,
      marketingWhatsapp: false,
      publishContent: false,
    },
    subscription: "free",
    passwordHash: await hashPassword(password),
    createdByAdminId: admin.id,
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  };

  await writeDb((db) => {
    db.users.push(user);
  });

  const record = await sendEmail(
    adminInviteEmail(
      user.name,
      user.email,
      password,
      roles.map((r) => ROLE_LABELS[r] ?? r),
    ),
  );

  return Response.json(
    {
      user: toPublicUser(user),
      // Returned so the admin can pass the credentials on directly when no
      // email provider is configured — the whole point of the outbox mode.
      password,
      email: { status: record.status, provider: record.provider, error: record.error },
    },
    { status: 201 },
  );
}
