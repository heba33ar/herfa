import "server-only";

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { type Db, DB_VERSION, emptyDb } from "./schema";

/**
 * A single-document JSON database.
 *
 * The owner asked for "a json file", and that is exactly what this is — the
 * only question is where the file lives:
 *
 *   file   — data/db.json on disk. Used locally. Survives restarts.
 *   blob   — the same JSON document in Vercel Blob. Used on Vercel, where the
 *            function filesystem is read-only. Survives cold starts.
 *   memory — last resort. Seeded, works, but every write is lost when the
 *            instance recycles. We log loudly so this is never a silent lie.
 *
 * The driver is chosen once per process from the environment.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const SEED_PATH = path.join(DATA_DIR, "db.seed.json");
/**
 * One document per environment.
 *
 * The Blob store is shared by every environment that holds the token, so
 * without this a developer running the app locally would be reading and
 * writing the live demo's database.
 */
const BLOB_PATHNAME = (() => {
  const env = process.env.VERCEL_ENV;
  if (env === "production") return "herfa/db.json";
  if (env) return `herfa/db.${env}.json`;
  return "herfa/db.local.json";
})();

interface Driver {
  name: string;
  read: () => Promise<Db | null>;
  write: (db: Db) => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/* Drivers                                                                    */
/* -------------------------------------------------------------------------- */

const fileDriver: Driver = {
  name: "file",
  async read() {
    try {
      return JSON.parse(await readFile(DB_PATH, "utf8")) as Db;
    } catch {
      return null;
    }
  },
  async write(db) {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  },
};

const blobDriver: Driver = {
  name: "blob",
  async read() {
    const { get } = await import("@vercel/blob");
    // useCache:false matters — an overwritten blob can otherwise serve a stale
    // body for up to a minute, which would silently lose writes.
    const result = await get(BLOB_PATHNAME, { access: "private", useCache: false });
    if (!result?.stream) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as Db;
  },
  async write(db) {
    const { put } = await import("@vercel/blob");
    await put(BLOB_PATHNAME, JSON.stringify(db, null, 2), {
      access: "private",
      contentType: "application/json",
      allowOverwrite: true,
      addRandomSuffix: false,
      cacheControlMaxAge: 60,
    });
  },
};

function memoryDriver(): Driver {
  let held: Db | null = null;
  return {
    name: "memory",
    async read() {
      return held;
    },
    async write(db) {
      held = db;
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Driver selection                                                           */
/* -------------------------------------------------------------------------- */

let driver: Driver | null = null;
let announced = false;

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function selectDriver(): Driver {
  if (driver) return driver;
  driver = blobConfigured() ? blobDriver : fileDriver;
  return driver;
}

/** Called when the chosen driver cannot write — demotes to memory, once. */
function demoteToMemory(reason: unknown) {
  const current = driver?.name ?? "unknown";
  driver = memoryDriver();
  console.warn(
    `[db] "${current}" driver cannot write (${String(reason)}). ` +
      `Falling back to in-memory storage: changes will be lost when this ` +
      `instance recycles. On Vercel, provision Blob storage to persist data.`,
  );
}

/* -------------------------------------------------------------------------- */
/* Seeding                                                                    */
/* -------------------------------------------------------------------------- */

async function loadSeed(): Promise<Db> {
  try {
    const seed = JSON.parse(await readFile(SEED_PATH, "utf8")) as Db;
    return { ...emptyDb(), ...seed, version: DB_VERSION };
  } catch {
    console.warn("[db] no seed file found — starting empty");
    return emptyDb();
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Short-lived per-instance copy of the document.
 *
 * A deployment runs on several instances, each with its own memory. Holding
 * the document indefinitely would mean one instance writing a copy that never
 * saw another instance's changes — silently discarding them — and an edit made
 * outside the app never taking effect at all.
 *
 * So the cache only absorbs bursts within a single request, and every write
 * re-reads the stored document first. The read costs one 13 KB fetch; losing
 * someone's account does not.
 */
let cache: { db: Db; at: number } | null = null;
const CACHE_TTL_MS = 2_000;

/**
 * Serialises writes within this process. It does not coordinate across
 * instances — acceptable for a POC, and noted in the README.
 */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

export async function readDb(options?: { fresh?: boolean }): Promise<Db> {
  if (!options?.fresh && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.db;
  }

  const active = selectDriver();
  let loaded: Db | null = null;
  try {
    loaded = await active.read();
  } catch (error) {
    console.warn(`[db] read via "${active.name}" failed:`, error);
  }

  if (!loaded) {
    loaded = await loadSeed();
    // Persist the seed so the first write is not also the first create.
    try {
      await active.write(loaded);
    } catch (error) {
      demoteToMemory(error);
      await driver!.write(loaded);
    }
  }

  if (!announced) {
    announced = true;
    console.log(`[db] using "${driver?.name ?? active.name}" driver`);
  }

  cache = { db: loaded, at: Date.now() };
  return loaded;
}

/**
 * Reads, applies `mutate`, then persists. The mutation runs inside the write
 * queue so two concurrent requests cannot clobber one another's changes.
 */
export async function writeDb<T>(mutate: (db: Db) => T | Promise<T>): Promise<T> {
  return enqueue(async () => {
    // Always re-read before mutating: another instance may have written since
    // this one last looked, and mutating a stale copy would drop its changes.
    const db = await readDb({ fresh: true });
    const result = await mutate(db);
    try {
      await selectDriver().write(db);
    } catch (error) {
      demoteToMemory(error);
      await driver!.write(db);
    }
    cache = { db, at: Date.now() };
    return result;
  });
}

/**
 * Reports which backend is actually in use.
 *
 * This performs a real no-op write rather than inferring from the selected
 * driver. Reading alone can succeed on a read-only filesystem and would have
 * us claim the data is durable right up until the first save fails.
 */
export async function dbStatus() {
  await writeDb(() => undefined);
  return {
    driver: driver?.name ?? "unknown",
    persistent: driver?.name !== "memory",
    blobConfigured: blobConfigured(),
  };
}
