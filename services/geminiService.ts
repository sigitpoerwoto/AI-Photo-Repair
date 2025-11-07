import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { AspectRatio } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export const getRandomImagePrompt = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Hasilkan satu prompt gambar yang sangat detail dan kreatif untuk generator gambar AI. Prompt harus fotorealistik, imajinatif, dan spesifik. Kembalikan hanya teks prompt, tanpa label atau kata-kata tambahan.",
            config: {
                temperature: 1, 
                topP: 0.95,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting random prompt:", error);
        throw new Error("Gagal mendapatkan ide acak. Silakan coba lagi.");
    }
};

export const getPromptSuggestions = async (currentPrompt: string): Promise<string[]> => {
    try {
        const prompt = `Berdasarkan prompt pembuatan gambar berikut: "${currentPrompt}". Hasilkan daftar tepat 16 saran yang beragam dan kreatif untuk menambahkan lebih banyak detail atau memodifikasi prompt. Saran harus berupa frasa atau klausa pendek yang dapat ditambahkan. Kembalikan respons sebagai objek JSON yang valid dengan satu kunci 'suggestions' yang merupakan array berisi 16 string.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Sebuah array berisi 16 saran pengeditan yang dapat ditindaklanjuti."
                        }
                    },
                    required: ["suggestions"],
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);
        if (!jsonResponse.suggestions || !Array.isArray(jsonResponse.suggestions)) {
            throw new Error("Format respons tidak valid dari API saran.");
        }
        return jsonResponse.suggestions;
    } catch (error) {
        console.error("Error getting prompt suggestions:", error);
        throw new Error("Gagal mendapatkan saran AI. Silakan periksa konsol untuk detailnya.");
    }
};

export const getSinglePromptSuggestion = async (currentPrompt: string, existingSuggestions: string[]): Promise<string> => {
    try {
        const prompt = `Berdasarkan prompt pembuatan gambar berikut: "${currentPrompt}". Hasilkan satu saran unik dan kreatif untuk menambahkan lebih banyak detail atau memodifikasi prompt. Saran harus berupa frasa atau klausa pendek yang dapat ditambahkan. Jangan ulangi saran berikut: "${existingSuggestions.join('", "')}". Kembalikan hanya teks saran baru, tanpa label atau kutipan.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error getting single prompt suggestion:", error);
        throw new Error("Gagal mendapatkan saran baru.");
    }
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio,
            },
        });
        
        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        throw new Error("Tidak ada gambar yang dihasilkan.");

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Gagal membuat gambar. Silakan periksa konsol untuk detailnya.");
    }
};

export const editImage = async (file: File, prompt: string): Promise<string> => {
    try {
        const base64Data = await fileToBase64(file);
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: file.type,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates?.[0]?.content.parts ?? []) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        throw new Error("Tidak ada gambar editan yang dikembalikan.");

    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Gagal mengedit gambar. Silakan periksa konsol untuk detailnya.");
    }
};

export const analyzeAndSuggestEdits = async (file: File, existingSuggestions: string[] = []): Promise<{ analysis: string; suggestions: string[] }> => {
    try {
        const base64Data = await fileToBase64(file);
        
        const exclusionPrompt = existingSuggestions.length > 0
            ? `Hindari memberikan saran yang mirip dengan ini: "${existingSuggestions.join('", "')}".`
            : '';

        const prompt = `Analisis gambar yang diunggah secara komprehensif.
        
        1.  **Analisis Konteks**: Berikan deskripsi singkat tentang konten, kualitas teknis, dan komposisi gambar. Pertahankan gaya analisis yang objektif dan informatif seperti sebelumnya.
        
        2.  **Saran Peningkatan**: Berdasarkan analisis, buat daftar TEPAT 16 saran yang beragam dan dapat ditindaklanjuti untuk MENINGKATKAN gambar secara estetis. Sertakan campuran dari kedua kategori berikut:
            *   **Perbaikan Teknis**: Contohnya 'Hilangkan goresan dari foto lama', 'Tingkatkan saturasi warna agar lebih hidup', 'Pertajam detail pada subjek utama'.
            *   **Saran Kreatif**: Contohnya 'Coba sudut pengambilan dari bawah untuk efek dramatis', 'Gunakan pencahayaan samping (sidelighting) untuk menonjolkan tekstur', 'Sarankan pose yang lebih santai dan natural', 'Ganti latar belakang menjadi pemandangan kota di malam hari', 'Terapkan filter warna sinematik dengan nuansa teal and orange'.
        
        ${exclusionPrompt}

        Kembalikan respons sebagai objek JSON yang valid dengan dua kunci: 'analysis' (string untuk Analisis Konteks) dan 'suggestions' (array berisi 16 string untuk Saran Peningkatan).`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: file.type, data: base64Data } },
                    { text: prompt },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        analysis: {
                            type: Type.STRING,
                            description: "Analisis singkat tentang konten dan kualitas gambar."
                        },
                        suggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Sebuah array berisi 16 saran pengeditan teknis dan kreatif yang dapat ditindaklanjuti."
                        }
                    },
                    required: ["analysis", "suggestions"],
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);
        if (!jsonResponse.analysis || !jsonResponse.suggestions || !Array.isArray(jsonResponse.suggestions)) {
            throw new Error("Format respons tidak valid dari API analisis.");
        }
        return jsonResponse;

    } catch (error) {
        console.error("Error analyzing image for suggestions:", error);
        throw new Error("Gagal mendapatkan saran AI. Silakan periksa konsol untuk detailnya.");
    }
};

export const analyzeImage = async (file: File): Promise<string> => {
    try {
        const base64Data = await fileToBase64(file);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: file.type,
                            data: base64Data,
                        },
                    },
                    { text: "Jelaskan gambar ini secara detail dalam Bahasa Indonesia. Apa yang sedang terjadi, apa saja objek utamanya, dan bagaimana suasana atau tema keseluruhannya?" },
                ],
            },
        });

        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Gagal menganalisis gambar. Silakan periksa konsol untuk detailnya.");
    }
};