import { CityLocation, GeminiResponse } from "../types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const fetchCityData = async (location: CityLocation) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error("Missing VITE_OPENROUTER_API_KEY in environment variables");
    }

    const prompt = `
    Act as a Local SEO Expert specializing in service area pages for trades (plumbers, electricians, HVAC).
    
    Goal: Identify ALL specific "Service Areas" within ${location.city}, ${location.state} to populate a "We Serve These Neighborhoods" section on a website.
    
    Target Data (in order of priority):
    1. Residential Neighborhoods (e.g., "Lincoln Park", "Hyde Park").
    2. Master-Planned Communities & Subdivisions (e.g., "Oak Creek Estates", "Sunset Hills").
    3. Key Commercial Districts/Corridors (where businesses need services).
    4. Nearby Unincorporated Communities or Census-Designated Places (CDPs) often associated with this city.
    5. Common vernacular area names used by locals (e.g., "The West Side", "Downtown").

    Exclude: Individual buildings or protected parks that are strictly tourist attractions and not service areas (e.g., "City Statue", "National Park"). However, if a landmark defines an area (e.g., "Diamond District"), include it.

    Be exhaustive. LIST AS MANY AS POSSIBLE.
    
    Return the response strictly as a valid JSON object:
    {
      "neighborhoods": ["Area Name 1", "Area Name 2", ... (aim for 20+ if applicable)],
      "famous_buildings": ["Building/Landmark 1", ... (keep these limited to major ones defining the skyline or area)],
      "description": "A professional 2-sentence SEO-optimized overview of the city's geography and key service zones.",
      "sources": [
        { "title": "Source Name", "uri": "URL" }
      ]
    }
    
    Ensure the data is accurate. return only valid JSON.
  `;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter for some free models
                "X-Title": "City Finder App"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-001", // Using a Gemini model via OpenRouter as default, user can change this
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";

        // Clean up markdown code blocks if present
        const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();

        const parsedData: GeminiResponse = JSON.parse(cleanContent);

        return {
            neighborhoods: parsedData.neighborhoods || [],
            famous_buildings: parsedData.famous_buildings || [],
            description: parsedData.description || "",
            sources: parsedData.sources || []
        };

    } catch (error) {
        console.error(`Error fetching data for ${location.city}:`, error);
        throw error;
    }
};
