import OpenAI from "openai";
import { z } from "zod";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const foodItemSchema = z.object({
  name: z.string(),
  estimatedGrams: z.number().positive(),
});

const analysisResponseSchema = z.object({
  items: z.array(foodItemSchema),
});

export type AnalyzedFoodItem = z.infer<typeof foodItemSchema>;

export async function analyzeFoodImage(
  imageBase64: string
): Promise<AnalyzedFoodItem[]> {
  try {
    const response = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this food photo. Identify each distinct food item and estimate the weight in grams. Return JSON in this exact format:
{"items": [{"name": "grilled chicken breast", "estimatedGrams": 200}, {"name": "white rice", "estimatedGrams": 150}]}

Rules:
- Use common English food names that would match a food database search
- Be specific (e.g. "white rice" not just "rice", "grilled chicken breast" not just "chicken")
- Estimate realistic portion sizes in grams
- If no food is visible, return {"items": []}
- Do not include drinks, utensils, or non-food items`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    const validated = analysisResponseSchema.safeParse(parsed);

    if (!validated.success) return [];

    return validated.data.items;
  } catch (error) {
    console.error("OpenAI food analysis failed:", error);
    return [];
  }
}
