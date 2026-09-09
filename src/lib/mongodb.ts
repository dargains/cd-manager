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
