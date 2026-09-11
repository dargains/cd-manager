import { MongoClient } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  const uri = process.env.STORAGE_MONGODB_URI;
  if (!uri) {
    throw new Error("Missing STORAGE_MONGODB_URI environment variable");
  }

  if (process.env.NODE_ENV === "development") {
    // Reuse the client across hot reloads in dev so we don't exhaust connections.
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    return global._mongoClientPromise;
  }

  return new MongoClient(uri).connect();
}

let clientPromise: Promise<MongoClient> | undefined;

export async function getDb() {
  if (!clientPromise) {
    clientPromise = createClientPromise();
  }
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || "cd_manager");
}

// MongoDB's default string comparison is byte-wise, so every capitalized
// name sorts before any lowercase one (e.g. "alt-J" would land after "Z").
// Use this collation on .sort() calls over artist/title for a normal
// case-insensitive alphabetical order instead.
export const CASE_INSENSITIVE_COLLATION = { locale: "en", strength: 2 } as const;
