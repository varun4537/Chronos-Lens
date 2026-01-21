import { GoogleGenAI, Type } from "@google/genai";
import { PhotoStyle, GenerationRequest, GeneratedImage } from "../types";

// Helper to ensure key is selected before we start
export const ensureApiKey = async (): Promise<boolean> => {
  if (window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
      return await window.aistudio.hasSelectedApiKey();
    }
    return true;
  }
  return false;
};

export interface VisualContext {
  visualPrompt: string;
  story: string;
}

// Step 1: Use Flash to understand history and create a visual prompt + story
export const generateVisualPrompt = async (request: GenerationRequest): Promise<VisualContext> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Location Coordinates: ${request.location.coords.lat}, ${request.location.coords.lng}
    Location Name: ${request.location.name}
    Date: ${request.date}
    ${request.time ? `Time: ${request.time}` : ''}
    
    Your task is twofold:
    1. 'visualPrompt': Describe the visual scene for an image generator. Focus on clothing, architecture, atmosphere, and historical accuracy.
    2. 'story': Write a brief, engaging, and fun historical snapshot/narrative of what is happening. Imagine you are a witty time-travel guide explaining the scene to a first-time traveler.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: "You are a historical visualization expert and storyteller. Return JSON only.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            visualPrompt: { type: Type.STRING },
            story: { type: Type.STRING }
        },
        required: ["visualPrompt", "story"]
      }
    }
  });

  try {
      const json = JSON.parse(response.text || "{}");
      return {
          visualPrompt: json.visualPrompt || "A historical scene.",
          story: json.story || "Welcome to the past!"
      };
  } catch (e) {
      console.error("Failed to parse JSON from Gemini Flash", e);
      return {
          visualPrompt: response.text || "A historical scene.",
          story: "Time travel successful, but the flight log is scrambled."
      };
  }
};

// Step 2: Use Pro Image 3 (Nano Banana 3) to generate the image
export const generateSnapshot = async (request: GenerationRequest, context: VisualContext): Promise<GeneratedImage> => {
  // Create new instance to pick up potentially new API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const finalPrompt = `
    ${context.visualPrompt}
    
    Style: ${request.style}.
    Quality: High resolution, photorealistic, 8k, detailed textures.
    Camera: Accurate to the era if vintage, or modern high-end capture if realistic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // Nano Banana 3 / High Quality
      contents: {
        parts: [{ text: finalPrompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "16:9", // Cinematic feel
            imageSize: "2K" // High quality
        }
      }
    });

    let imageUrl = '';
    
    // Parse response for image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    }

    if (!imageUrl) {
        throw new Error("No image data received from API.");
    }

    return {
      imageUrl,
      description: context.visualPrompt,
      story: context.story,
      promptUsed: finalPrompt
    };
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};
