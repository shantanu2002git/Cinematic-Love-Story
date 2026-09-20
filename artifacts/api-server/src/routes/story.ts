import { Router, type IRouter } from "express";
import { storyCollection, type StoryDocument } from "../lib/mongo";

const router: IRouter = Router();

router.get("/story", async (_req, res, next) => {
  try {
    const collection = await storyCollection();
    const document = await collection.findOne({ key: "main" });
    res.json({ photos: document?.photos ?? [], coordinates: document?.coordinates ?? [] });
  } catch (error) {
    next(error);
  }
});

router.put("/story", async (req, res, next) => {
  try {
    const { photos, coordinates } = req.body as Partial<StoryDocument>;
    if (!Array.isArray(photos) || !Array.isArray(coordinates)) {
      res.status(400).json({ message: "photos and coordinates must be arrays" });
      return;
    }

    const collection = await storyCollection();
    await collection.updateOne(
      { key: "main" },
      { $set: { photos, coordinates, updatedAt: new Date() }, $setOnInsert: { key: "main" } },
      { upsert: true },
    );
    res.json({ photos, coordinates });
  } catch (error) {
    next(error);
  }
});

export default router;