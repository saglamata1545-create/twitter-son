import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateQuoteTexts = async (context: string, count: number): Promise<string[]> => {
  if (!apiKey) {
    throw new Error("API Anahtarı bulunamadı.");
  }

  try {
    const prompt = `
      Sen bir sosyal medya uzmanısın. Twitter (X) için "${context}" konusu hakkında ${count} adet farklı, ilgi çekici ve etkileşim alacak Türkçe alıntı tweet (quote tweet) metni yaz.
      
      Kurallar:
      1. Sadece Türkçe yaz.
      2. Her satırda bir adet tweet metni olsun.
      3. Numaralandırma yapma.
      4. Hashtag kullanma.
      5. Samimi, bazen eleştirel, bazen destekleyici farklı tonlar kullan.
      6. Sadece metinleri döndür, giriş veya bitiş konuşması yapma.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    // Split by new line and filter empty lines
    return text.split('\n').filter(line => line.trim().length > 0).map(l => l.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};