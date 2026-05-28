import { Router, type IRouter } from "express";
import { TranslateMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

const translationCache = new Map<string, string>();

async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string | null,
): Promise<string> {
  const cacheKey = `${sourceLang ?? "auto"}:${targetLang}:${text}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: sourceLang ?? "auto",
        target: targetLang,
        format: "text",
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return text;
    }

    const data = (await response.json()) as { translatedText?: string };
    const translated = data.translatedText ?? text;

    if (translationCache.size > 1000) {
      const firstKey = translationCache.keys().next().value;
      if (firstKey !== undefined) translationCache.delete(firstKey);
    }
    translationCache.set(cacheKey, translated);

    return translated;
  } catch {
    return text;
  }
}

router.post("/translations", async (req, res): Promise<void> => {
  const parsed = TranslateMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { text, targetLang, sourceLang } = parsed.data;

  const translatedText = await translateText(text, targetLang, sourceLang);

  res.json({
    translatedText,
    originalText: text,
    targetLang,
    sourceLang: sourceLang ?? null,
  });
});

export default router;
