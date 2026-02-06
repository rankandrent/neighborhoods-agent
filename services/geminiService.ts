
import { GoogleGenAI } from "@google/genai";
import { CityLocation, GeminiResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const fetchCityData = async (location: CityLocation) => {
  const prompt = `
    Find detailed information about the neighborhoods, famous buildings, landmarks, and key areas in the city of ${location.city}, ${location.state}.
    
    Return the response strictly as a JSON object with the following structure:
    {
      "neighborhoods": ["name1", "name2", ...],
      "famous_buildings": ["building1", "landmark1", ...],
      "description": "A brief 2-3 sentence overview of the city's vibe and geography."
    }
    
    Ensure you use Google Search to find accurate and up-to-date data for this specific location.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "{}";
    const data: GeminiResponse = JSON.parse(text);
    
    // Extract sources from grounding metadata if available
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri || ""
    })) || [];

    return {
      ...data,
      sources
    };
  } catch (error) {
    console.error(`Error fetching data for ${location.city}:`, error);
    throw error;
  }
};
