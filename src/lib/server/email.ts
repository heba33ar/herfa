import "server-only";

import { randomUUID } from "node:crypto";
import { writeDb } from "./db";
import type { DbEmail } from "./schema";

/**
 * Email with an outbox in front of it.
 *
 * Every message is recorded in the database first, then transmitted if a
 * provider is configured. With no API key the app still works end to end and
 * the admin can read exactly what would have been sent — which is what makes
 * this demoable before anyone signs up for anything.
 *
 * Turning on real delivery is one environment variable, no code change.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: DbEmail["template"];
  /**
   * Substrings to mask in the stored copy. A temporary password has to travel
   * in the message itself, but keeping it readable forever in the outbox —
   * which any admin can open — would make the database a password list.
   */
  redact?: string[];
}

interface Provider {
  name: string;
  send: (message: EmailMessage) => Promise<{ id?: string }>;
}

function resolveProvider(): Provider | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const from = process.env.EMAIL_FROM || "Hirfa <no-reply@example.com>";

  return {
    name: "resend",
    async send(message) {
      const { Resend } = await import("resend");
      const client = new Resend(apiKey);
      const { data, error } = await client.emails.send({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      if (error) {
        // Surfaced verbatim in the admin outbox so a provider rejection
        // explains itself instead of looking like a bug in the app.
        throw new Error(`${error.name}: ${error.message}`);
      }
      return { id: data?.id };
    },
  };
}

export async function sendEmail(message: EmailMessage): Promise<DbEmail> {
  const provider = resolveProvider();
  const createdAt = new Date().toISOString();

  const mask = (value: string) =>
    (message.redact ?? []).reduce(
      (acc, secret) => (secret ? acc.split(secret).join("••••••") : acc),
      value,
    );

  const record: DbEmail = {
    id: randomUUID(),
    to: message.to,
    subject: message.subject,
    // The transmitted copy below still carries the real value; only what we
    // persist is masked.
    html: mask(message.html),
    text: mask(message.text),
    template: message.template,
    provider: provider?.name ?? "outbox",
    status: "recorded",
    createdAt,
  };

  if (provider) {
    try {
      const { id } = await provider.send(message);
      record.status = "sent";
      record.providerMessageId = id;
    } catch (error) {
      record.status = "failed";
      record.error = error instanceof Error ? error.message : String(error);
      console.warn(`[email] send failed via ${provider.name}:`, record.error);
    }
  } else {
    console.log(`[email:outbox] → ${message.to} · ${message.subject}`);
  }

  await writeDb((db) => {
    db.emails.unshift(record);
    // Keep the outbox bounded; this is a demo, not an archive.
    db.emails = db.emails.slice(0, 200);
  });

  return record;
}

export function emailProviderStatus() {
  return {
    configured: Boolean(process.env.RESEND_API_KEY),
    provider: process.env.RESEND_API_KEY ? "resend" : "outbox",
    from: process.env.EMAIL_FROM || "Hirfa <no-reply@example.com>",
  };
}
