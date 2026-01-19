import { getCachedTranslation, cacheTranslation } from "./translation-cache";

const GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";

// Pattern to detect non-ASCII characters (likely non-English)
const NON_ASCII_PATTERN = /[^\x00-\x7F]/;

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedLang: string;
  wasTranslated: boolean;
  fromCache: boolean;
}

/**
 * Quick check if text likely needs translation.
 * Returns true if text contains non-ASCII characters.
 */
export function mightNeedTranslation(text: string): boolean {
  return NON_ASCII_PATTERN.test(text);
}

/**
 * Translate text to English using Google Cloud Translation API.
 * Returns original text if already English or translation fails.
 */
export async function translateToEnglish(text: string): Promise<TranslationResult> {
  const normalizedText = text.trim();

  // Skip if likely already English (no non-ASCII characters)
  if (!mightNeedTranslation(normalizedText)) {
    return {
      originalText: normalizedText,
      translatedText: normalizedText,
      detectedLang: "en",
      wasTranslated: false,
      fromCache: false,
    };
  }

  // Check cache first
  const cached = await getCachedTranslation(normalizedText);
  if (cached) {
    return {
      originalText: normalizedText,
      translatedText: cached.translatedText,
      detectedLang: cached.detectedLang,
      wasTranslated: true,
      fromCache: true,
    };
  }

  // Call Google Translate API
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_TRANSLATE_API_KEY not set, skipping translation");
    return {
      originalText: normalizedText,
      translatedText: normalizedText,
      detectedLang: "unknown",
      wasTranslated: false,
      fromCache: false,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const response = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: normalizedText,
        target: "en",
        format: "text",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Translate API error: ${response.status}`, errorText);
      return {
        originalText: normalizedText,
        translatedText: normalizedText,
        detectedLang: "unknown",
        wasTranslated: false,
        fromCache: false,
      };
    }

    const data = await response.json();
    const translation = data.data?.translations?.[0];

    if (!translation) {
      console.error("Unexpected Google Translate response format:", data);
      return {
        originalText: normalizedText,
        translatedText: normalizedText,
        detectedLang: "unknown",
        wasTranslated: false,
        fromCache: false,
      };
    }

    const translatedText = translation.translatedText;
    const detectedLang = translation.detectedSourceLanguage || "unknown";

    // If detected as English, return original (no translation needed)
    if (detectedLang === "en") {
      return {
        originalText: normalizedText,
        translatedText: normalizedText,
        detectedLang: "en",
        wasTranslated: false,
        fromCache: false,
      };
    }

    // Cache the translation (fire-and-forget)
    cacheTranslation(normalizedText, translatedText, detectedLang).catch((err) => {
      console.error("Failed to cache translation:", err);
    });

    return {
      originalText: normalizedText,
      translatedText,
      detectedLang,
      wasTranslated: true,
      fromCache: false,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Translation request timed out");
    } else {
      console.error("Translation error:", error);
    }
    return {
      originalText: normalizedText,
      translatedText: normalizedText,
      detectedLang: "unknown",
      wasTranslated: false,
      fromCache: false,
    };
  }
}
