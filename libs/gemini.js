import axios from 'axios';
import config from '../config.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Memanggil REST API Google Gemini
 * @param {string} promptText
 * @param {number} temperature
 * @returns {Promise<string|null>}
 */
async function callGeminiApi(promptText, temperature = 0.2) {
    const apiKey = config.GEMINI_API_KEY;
    if (!apiKey) {
        return null;
    }

    try {
        const response = await axios.post(
            GEMINI_API_URL,
            {
                contents: [
                    {
                        parts: [{ text: promptText }]
                    }
                ],
                generationConfig: {
                    temperature: temperature,
                    maxOutputTokens: 1024
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                timeout: 10000
            }
        );

        const candidates = response.data?.candidates;
        if (candidates && candidates.length > 0) {
            return candidates[0].content?.parts[0]?.text?.trim() || null;
        }
        return null;
    } catch (error) {
        console.error('Gemini API Error:', error?.response?.data || error.message);
        return null;
    }
}

/**
 * Mengekstrak lokasi asal dan tujuan dari kalimat bahasa bebas pengguna menggunakan Gemini AI
 * @param {string} userText
 * @returns {Promise<{ asal: string|null, tujuan: string|null }|null>}
 */
export async function parseAngkotQueryWithGemini(userText) {
    if (!userText || !config.GEMINI_API_KEY) return null;

    const prompt = `
Anda adalah AI ekstraktor lokasi transportasi di Kota Bogor, Indonesia.
Tugas Anda: Ekstrak lokasi ASAL (origin) dan TUJUAN (destination) dari pertanyaan bahasa Indonesia pengguna.
Jika nama tempat sangat spesifik (misal nama kafe, hotel, atau toko), petakan ke landmark/jalan utama terdekat di Kota Bogor.

Keluarkan respon HANYA dalam format JSON berikut (tanpa markdown backtick):
{"asal": "nama_asal", "tujuan": "nama_tujuan"}

Jika tidak ditemukan asal atau tujuan, isi dengan null.
Pertanyaan pengguna: "${userText}"
`.trim();

    const rawResponse = await callGeminiApi(prompt, 0.1);
    if (!rawResponse) return null;

    try {
        const cleaned = rawResponse.replace(/```json|```/g, '').trim();
        const json = JSON.parse(cleaned);
        return {
            asal: json.asal || null,
            tujuan: json.tujuan || null
        };
    } catch (e) {
        return null;
    }
}

/**
 * Memberikan saran navigasi alternatif AI jika rute lokal angkot tidak ditemukan di database
 * @param {string} asal
 * @param {string} tujuan
 * @returns {Promise<string|null>}
 */
export async function getGeminiNavigationAdvice(asal, tujuan) {
    if (!config.GEMINI_API_KEY) return null;

    const prompt = `
Anda adalah "Nexure-Bot", asisten AI yang ramah, imut, dan menggunakan bahasa santun kepada pengguna (memanggil "Kak" atau "Kakak manis", menggunakan emoji imut seperti (˶˃ ᵕ ˂˶), (๑>ᴗ<๑), (╥﹏╥), ✨).

Pengguna mencari rute dari "${asal}" ke "${tujuan}" di sekitar Bogor/Jabodetabek, tetapi rute angkot lokal tidak ditemukan secara langsung di database.
Berikan panduan singkat, ramah, dan informatif tentang opsi rute transportasi alternatif (misal: naik KRL Commuter Line, Transpakuan, Feeder, Bus, Ojek Online, atau rute ganti angkot terdekat).

Gaya penulisan:
- Sopan, membantu, dan imut khas Nexure-Bot.
- Gunakan ringkas dan poin-poin tebal (*).
`.trim();

    return await callGeminiApi(prompt, 0.7);
}
