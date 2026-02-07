
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      floor: { type: Type.STRING },
      type: { type: Type.STRING },
      day: { type: Type.INTEGER },
      value: { type: Type.INTEGER }
    },
    required: ["floor", "type", "day", "value"]
  }
};

/**
 * Cleans a string that might contain markdown code blocks or other noise 
 * to extract a valid JSON string.
 */
function cleanJsonResponse(raw: string): string {
  // Remove markdown code blocks like ```json ... ``` or ``` ... ```
  let cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1');
  return cleaned.trim();
}

export async function extractInventoryFromImage(base64Image: string) {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Extract inventory data from this hand-written log.
    Valid Floors: 2, 85, 86, 87, 99, 100, 105, 107, 108.
    Valid Toilet Types: MALE PUBLIC, FEMALE PUBLIC, MALE STAFF, FEMALE STAFF, POWDER ROOM.
    Return a JSON array of objects with keys: floor (string), type (string), day (integer 1-31), value (integer).
  `;

  try {
    const result = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = result.text;
    if (!text) return [];

    const jsonString = cleanJsonResponse(text);
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("AI Extraction failed:", e);
    return [];
  }
}
