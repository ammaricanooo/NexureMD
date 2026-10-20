import axios from 'axios';
import config from '../config.js';

export const GEMINI_MODELS = [
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite'
];

/**
 * Memanggil REST API Google Gemini dengan fallback model otomatis jika error/overloaded
 * @param {Object} options
 * @param {Array} options.contents - Format standar Gemini contents [{ role, parts }]
 * @param {string} [options.systemInstruction] - Instruksi sistem
 * @param {number} [options.temperature=0.7] - Nilai kreativitas
 * @param {number} [options.maxTokens=1500] - Maksimal token output
 * @returns {Promise<string>}
 */
export async function callGemini({
    contents,
    systemInstruction = null,
    temperature = 0.7,
    maxTokens = 1500
}) {
    const apiKey = config.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY belum dikonfigurasi di file .env');
    }

    const payload = {
        contents,
        generationConfig: {
            temperature,
            maxOutputTokens: maxTokens
        }
    };

    if (systemInstruction) {
        payload.systemInstruction = {
            parts: [{ text: systemInstruction }]
        };
    }

    let lastError = null;

    for (const model of GEMINI_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await axios.post(url, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 25000
            });

            const candidates = response.data?.candidates;
            if (candidates && candidates.length > 0) {
                const text = candidates[0].content?.parts?.[0]?.text?.trim();
                if (text) return text;
            }
        } catch (error) {
            lastError = error;
            const errMsg = error.response?.data?.error?.message || error.message;
            console.warn(`[Gemini] Gagal memanggil ${model}:`, errMsg);
        }
    }

    throw lastError || new Error('Semua model Gemini sedang tidak dapat diakses');
}

/**
 * Mengekstrak lokasi asal dan tujuan dari kalimat bahasa bebas pengguna
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

    try {
        const rawResponse = await callGemini({
            contents: [{ parts: [{ text: prompt }] }],
            temperature: 0.1,
            maxTokens: 512
        });

        if (!rawResponse) return null;

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
 * Memberikan saran navigasi alternatif AI jika rute lokal angkot tidak ditemukan
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

    try {
        return await callGemini({
            contents: [{ parts: [{ text: prompt }] }],
            temperature: 0.7,
            maxTokens: 1024
        });
    } catch (error) {
        console.error('[Gemini] Gagal mendapatkan saran navigasi:', error.message);
        return null;
    }
}
