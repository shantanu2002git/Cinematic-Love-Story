import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { MongoClient, type Collection, type Db } from "mongodb";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const connectionString = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB ?? "cinematic-love-story";

if (!connectionString) {
  throw new Error("MONGODB_URI must be set in the API server environment.");
}

const client = new MongoClient(connectionString);
let databasePromise: Promise<Db> | undefined;

export function storyCollection(): Promise<Collection<StoryDocument>> {
  if (!databasePromise) {
    databasePromise = client.connect().then(connectedClient => connectedClient.db(databaseName));
  }
  return databasePromise.then(database => database.collection<StoryDocument>("story_archive"));
}

export type StoryPhoto = {
  id: string;
  title: string;
  place: string;
  category: "moments" | "memories" | "forever";
  src: string;
  description: string;
};

export type StoryCoordinate = {
  id: string;
  date: string;
  title: string;
  copy: string;
};

export type StoryDocument = {
  key: "main";
  photos: StoryPhoto[];
  coordinates: StoryCoordinate[];
  updatedAt: Date;
};