import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { UpsertProfileBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/profiles/me", async (req, res): Promise<void> => {
  const userId = Array.isArray(req.headers["x-user-id"])
    ? req.headers["x-user-id"][0]
    : req.headers["x-user-id"];

  if (!userId) {
    res.status(400).json({ error: "x-user-id header is required" });
    return;
  }

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, userId));

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({
    id: profile.id,
    username: profile.username,
    gender: profile.gender,
    country: profile.country ?? null,
    age: profile.age ?? null,
    interests: profile.interests ?? [],
    language: profile.language,
    createdAt: profile.createdAt.toISOString(),
  });
});

router.put("/profiles/me", async (req, res): Promise<void> => {
  const userId = Array.isArray(req.headers["x-user-id"])
    ? req.headers["x-user-id"][0]
    : req.headers["x-user-id"];

  if (!userId) {
    res.status(400).json({ error: "x-user-id header is required" });
    return;
  }

  const parsed = UpsertProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, gender, country, age, interests, language } = parsed.data;

  const [profile] = await db
    .insert(profilesTable)
    .values({
      id: userId,
      username,
      gender,
      country: country ?? null,
      age: age ?? null,
      interests: interests ?? [],
      language: language ?? "en",
    })
    .onConflictDoUpdate({
      target: profilesTable.id,
      set: {
        username,
        gender,
        country: country ?? null,
        age: age ?? null,
        interests: interests ?? [],
        language: language ?? "en",
      },
    })
    .returning();

  if (!profile) {
    res.status(500).json({ error: "Failed to upsert profile" });
    return;
  }

  req.log.info({ userId }, "Profile upserted");

  res.json({
    id: profile.id,
    username: profile.username,
    gender: profile.gender,
    country: profile.country ?? null,
    age: profile.age ?? null,
    interests: profile.interests ?? [],
    language: profile.language,
    createdAt: profile.createdAt.toISOString(),
  });
});

export default router;
