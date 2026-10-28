import "server-only";

import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import type { Role, User } from "@/lib/types";
import { readDb, writeDb } from "./db";
import { type DbUser, toPublicUser } from "./schema";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
export const SESSION_COOKIE = "herfa_session";
const SESSION_DAYS = 30;

/* -------------------------------------------------------------------------- */
/* Passwords                                                                  */
/* -------------------------------------------------------------------------- */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  // timingSafeEqual throws on a length mismatch, so this guard is load-bearing.
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

/** Readable temporary password for admin-created accounts. */
export function generatePassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < 10; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

function expiryFrom(nowIso: string) {
  const expires = new Date(nowIso);
  expires.setDate(expires.getDate() + SESSION_DAYS);
  return expires.toISOString();
}

/**
 * Creates a session row and sets the cookie.
 *
 * `secure` is deliberately NOT set: the demo is often opened over plain http
 * on a LAN address, where a Secure cookie is silently dropped and the whole
 * thing looks broken. This is a POC — noted in the README.
 */
export async function createSession(userId: string, nowIso: string): Promise<string> {
  const token = randomUUID();

  await writeDb((db) => {
    // Drop this user's expired rows while we are here.
    db.sessions = db.sessions.filter(
      (s) => s.userId !== userId || s.expiresAt > nowIso,
    );
    db.sessions.push({
      token,
      userId,
      createdAt: nowIso,
      expiresAt: expiryFrom(nowIso),
    });
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await writeDb((db) => {
      db.sessions = db.sessions.filter((s) => s.token !== token);
    });
  }
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user record, or null. Reads the cookie, not a header. */
export async function currentDbUser(): Promise<DbUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await readDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (session.expiresAt <= new Date().toISOString()) return null;

  return db.users.find((u) => u.id === session.userId) ?? null;
}

export async function currentUser(): Promise<User | null> {
  const user = await currentDbUser();
  return user ? toPublicUser(user) : null;
}

/** Throws a 403-shaped result when the signed-in user lacks `role`. */
export async function requireRole(role: Role): Promise<DbUser | null> {
  const user = await currentDbUser();
  if (!user || !user.roles.includes(role)) return null;
  return user;
}

/* -------------------------------------------------------------------------- */
/* Lookups                                                                    */
/* -------------------------------------------------------------------------- */

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const db = await readDb();
  const wanted = normaliseEmail(email);
  return db.users.find((u) => normaliseEmail(u.email) === wanted) ?? null;
}
