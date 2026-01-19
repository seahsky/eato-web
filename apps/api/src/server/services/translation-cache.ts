import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Translation cache TTL: 30 days (translations rarely change)
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function hashText(text: string): string {
  return crypto.createHash("sha256").update(text.toLowerCase().trim()).digest("hex");
}

export interface CachedTranslation {
  translatedText: string;
  detectedLang: string;
  fromCache: true;
}

export async function getCachedTranslation(
  originalText: string
): Promise<CachedTranslation | null> {
  const hash = hashText(originalText);

  const cached = await prisma.translationCache.findUnique({
    where: { originalHash: hash },
  });

  if (!cached || cached.expiresAt < new Date()) {
    // Cache miss or expired
    if (cached) {
      // Clean up expired entry (fire-and-forget)
      prisma.translationCache.delete({ where: { id: cached.id } }).catch(() => {});
    }
    return null;
  }

  // Increment hit count (fire-and-forget for performance)
  prisma.translationCache
    .update({
      where: { id: cached.id },
      data: { hitCount: { increment: 1 } },
    })
    .catch(() => {});

  return {
    translatedText: cached.translatedText,
    detectedLang: cached.detectedLang,
    fromCache: true,
  };
}

export async function cacheTranslation(
  originalText: string,
  translatedText: string,
  detectedLang: string
): Promise<void> {
  const hash = hashText(originalText);
  const normalizedOriginal = originalText.toLowerCase().trim();

  await prisma.translationCache.upsert({
    where: { originalHash: hash },
    create: {
      originalHash: hash,
      originalText: normalizedOriginal,
      detectedLang,
      translatedText,
      expiresAt: new Date(Date.now() + CACHE_TTL_MS),
    },
    update: {
      translatedText,
      detectedLang,
      expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      hitCount: { increment: 1 },
    },
  });
}

// Clean up expired translation cache entries
export async function cleanupExpiredTranslations(): Promise<number> {
  const result = await prisma.translationCache.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}
