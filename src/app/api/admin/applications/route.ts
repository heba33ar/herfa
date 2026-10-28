import { randomUUID } from "node:crypto";
import {
  findUserByEmail,
  generatePassword,
  hashPassword,
  normaliseEmail,
  requireRole,
} from "@/lib/server/auth";
import { writeDb } from "@/lib/server/db";
import type { DbUser } from "@/lib/server/schema";
import { sendEmail } from "@/lib/server/email";
import { applicationDecisionEmail } from "@/lib/server/templates";

type Decision = "accepted" | "rejected" | "needs_info";

/**
 * Records an admin's decision on a seller application and emails the applicant.
 *
 * On acceptance this also makes the seller a real account: an existing user
 * with that email gains the seller role, otherwise one is created and the
 * credentials go out in the same message. The id is returned so the client can
 * set the new store's `ownerId` to a user that actually exists — without this,
 * every accepted application produced a store nobody could sign in to manage.
 */
export async function POST(request: Request) {
  const admin = await requireRole("admin");
  if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "bad_request" }, { status: 400 });

  const status = String(body.status ?? "") as Decision;
  if (!["accepted", "rejected", "needs_info"].includes(status)) {
    return Response.json({ error: "invalid_status" }, { status: 400 });
  }

  const note = String(body.note ?? "").trim();
  if (!note) return Response.json({ error: "note_required" }, { status: 400 });

  const ownerName = String(body.ownerName ?? "").trim();
  const projectName = String(body.projectName ?? "").trim();
  const email = String(body.email ?? "").trim();
  if (!email) return Response.json({ error: "email_required" }, { status: 400 });

  let ownerId: string | undefined;
  let credentials: { email: string; password: string } | undefined;

  if (status === "accepted") {
    const existing = await findUserByEmail(email);

    if (existing) {
      ownerId = existing.id;
      if (!existing.roles.includes("seller")) {
        await writeDb((db) => {
          const user = db.users.find((u) => u.id === existing.id);
          if (user) user.roles = [...user.roles, "seller"];
        });
      }
    } else {
      const password = generatePassword();
      const user: DbUser = {
        id: `u-${randomUUID().slice(0, 8)}`,
        name: ownerName || email,
        email: normaliseEmail(email),
        phone: body.phone ? String(body.phone).trim() : undefined,
        townId: body.townId ? String(body.townId) : undefined,
        locale: "ar",
        roles: ["buyer", "seller"],
        consents: {
          terms: true,
          privacy: true,
          marketingEmail: false,
          marketingWhatsapp: false,
          publishContent: true,
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
      ownerId = user.id;
      credentials = { email: user.email, password };
    }
  }

  const record = await sendEmail(
    applicationDecisionEmail(normaliseEmail(email), ownerName || email, {
      projectName,
      status,
      note,
      credentials,
    }),
  );

  return Response.json({
    ownerId,
    credentials,
    email: { status: record.status, provider: record.provider, error: record.error },
  });
}
