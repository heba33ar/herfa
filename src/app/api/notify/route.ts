import { currentDbUser } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { sendEmail } from "@/lib/server/email";
import {
  applicationSubmittedEmail,
  orderPlacedEmail,
  orderStatusEmail,
} from "@/lib/server/templates";

/**
 * Notifications for events that still live in the client store (orders,
 * applications).
 *
 * Recipients are always resolved from the database by id — the client says
 * *who the event is about*, never what address to mail, so a tampered request
 * cannot redirect a notification to an arbitrary inbox.
 *
 * POC note: still unthrottled — one signed-in account can fire these in a
 * loop. It needs a rate limit before launch.
 */
export async function POST(request: Request) {
  // A session is required on every branch. Without it, application_submitted
  // was an open endpoint that mailed every admin on demand.
  if (!(await currentDbUser())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "bad_request" }, { status: 400 });

  const db = await readDb();
  const type = String(body.type ?? "");

  if (type === "order_placed") {
    const seller = db.users.find((u) => u.id === String(body.ownerId ?? ""));
    // A seeded store with no account behind it simply gets no email.
    if (!seller) return Response.json({ skipped: "no_seller_account" });

    const record = await sendEmail(
      orderPlacedEmail(seller.email, seller.name, {
        reference: String(body.reference ?? ""),
        buyerName: String(body.buyerName ?? ""),
        total: String(body.total ?? ""),
        items: String(body.items ?? ""),
      }),
    );
    return Response.json({ status: record.status });
  }

  if (type === "order_status") {
    const buyer = db.users.find((u) => u.id === String(body.buyerId ?? ""));
    if (!buyer) return Response.json({ skipped: "no_buyer_account" });

    const record = await sendEmail(
      orderStatusEmail(buyer.email, buyer.name, {
        reference: String(body.reference ?? ""),
        storeName: String(body.storeName ?? ""),
        status: String(body.status ?? ""),
        note: body.note ? String(body.note) : undefined,
      }),
    );
    return Response.json({ status: record.status });
  }

  if (type === "application_submitted") {
    const admins = db.users.filter((u) => u.roles.includes("admin"));
    if (admins.length === 0) return Response.json({ skipped: "no_admins" });

    const payload = {
      projectName: String(body.projectName ?? ""),
      ownerName: String(body.ownerName ?? ""),
      town: String(body.town ?? ""),
      category: String(body.category ?? ""),
    };
    for (const admin of admins) {
      await sendEmail(applicationSubmittedEmail(admin.email, payload));
    }
    return Response.json({ notified: admins.length });
  }

  return Response.json({ error: "unknown_type" }, { status: 400 });
}
