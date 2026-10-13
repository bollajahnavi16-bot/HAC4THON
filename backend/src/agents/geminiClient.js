import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

let genAI = null;
if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
  genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

export const isGeminiConfigured = () => {
  return Boolean(genAI && env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '');
};

/**
 * Generate AI reasoning using Gemini API with structured prompt.
 * Falls back gracefully to heuristic intelligence when API key is unset or rate limited.
 */
export const queryGeminiAgent = async ({ systemPrompt, userPrompt, fallbackGenerator }) => {
  if (isGeminiConfigured()) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 1500,
          responseMimeType: 'application/json',
        },
      });

      const fullPrompt = `${systemPrompt}\n\nStrict requirement: Respond in valid raw JSON matching the requested structure without markdown wrapping.\n\nInput Context:\n${userPrompt}`;
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();

      // Clean markdown code blocks if returned
      const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.warn(`[GeminiAgent] Gemini API invocation failed (${error.message}). Falling back to heuristic reasoning engine.`);
    }
  }

  // Graceful rule-based heuristic fallback
  return fallbackGenerator();
};
