import { Router, type IRouter } from "express";
import {
  storyCollection,
  type StoryCoordinate,
  type StoryDocument,
  type StoryPhoto,
} from "../lib/mongo";

const router: IRouter = Router();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStoryPhoto(value: unknown): value is StoryPhoto {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.place) &&
    (value.category === "moments" ||
      value.category === "memories" ||
      value.category === "forever") &&
    isNonEmptyString(value.src) &&
    isNonEmptyString(value.description)
  );
}

function isStoryCoordinate(value: unknown): value is StoryCoordinate {
  return (
    isRecord(value) &&
    isNonEmptyString(value.date) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.copy)
  );
}

function isStoryCoordinates(value: unknown): value is StoryCoordinate[] {
  return Array.isArray(value) && value.every(isStoryCoordinate);
}

function isStoryPhotos(value: unknown): value is StoryPhoto[] {
  return Array.isArray(value) && value.every(isStoryPhoto);
}

router.get("/story", async (_req, res, next) => {
  try {
    res.set("Cache-Control", "no-store");
    const collection = await storyCollection();
    const document = await collection.findOne({ key: "main" });
    res.json({ photos: document?.photos ?? [], coordinates: document?.coordinates ?? [] });
  } catch (error) {
    next(error);
  }
});

router.put("/story", async (req, res, next) => {
  try {
    const coordinates: unknown = req.body?.coordinates;
    if (!isStoryCoordinates(coordinates)) {
      res.status(400).json({ message: "coordinates must contain valid story entries" });
      return;
    }

    const collection = await storyCollection();
    await collection.updateOne(
      { key: "main" },
      {
        $set: { coordinates, updatedAt: new Date() },
        $setOnInsert: { key: "main", photos: [] },
      },
      { upsert: true },
    );
    res.json({ coordinates });
  } catch (error) {
    next(error);
  }
});

router.put("/story/photos", async (req, res, next) => {
  try {
    const photos: unknown = req.body?.photos;
    if (!isStoryPhotos(photos)) {
      res.status(400).json({ message: "photos must contain valid photo entries" });
      return;
    }

    const collection = await storyCollection();
    await collection.updateOne(
      { key: "main" },
      {
        $set: { photos, updatedAt: new Date() },
        $setOnInsert: { key: "main", coordinates: [] },
      },
      { upsert: true },
    );
    res.json({ photos });
  } catch (error) {
    next(error);
  }
});

export default router;