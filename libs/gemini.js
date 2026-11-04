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
