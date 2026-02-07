
import { GoogleGenAI, Type } from "@google/genai";
import { ToiletType } from "../types";

// Always use the process.env.API_KEY directly as per guidelines
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

export async function extractInventoryFromImage(base64Image: string) {
  // Use gemini-3-flash-preview for general OCR and extraction tasks
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    This image is a hand-written inventory log for tissue rolls.
    Extract the data for each floor and toilet type for all days recorded.
    The floors are 2, 85, 86, 87, 99, 100, 105, 107, 108.
    Toilet types are: MALE PUBLIC, FEMALE PUBLIC, MALE STAFF, FEMALE STAFF, POWDER ROOM.
    Output the data as a list of entries with floor, type, day (1-31), and the integer value recorded.
  `;

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

  try {
    // result.text is a property, not a method
    const text = result.text;
    return JSON.parse(text || '[]');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
}
