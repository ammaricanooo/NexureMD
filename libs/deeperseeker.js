import axios from 'axios';
import config from '../config.js';

const DEFAULT_API_URL = config.API_AMMARICANO || 'https://api.ammaricano.my.id';

/**
 * Memanggil API DeeperSeeker (DeepSeek R1 / V3 & V4.1 Flash dengan dukungan Multimodal Media)
 * @param {Object} options
 * @param {string} [options.prompt] - Pertanyaan atau pesan teks utama
 * @param {string} [options.imgUrl] - URL gambar/dokumen atau Base64 Data URI (data:...;base64,...)
 * @param {string} [options.image] - Alias untuk imgUrl
 * @param {string} [options.fileUrl] - Alias untuk imgUrl dokumen
 * @param {Array}  [options.messages] - Array pesan percakapan format OpenAI [{ role, content }]
 * @param {string} [options.systemPrompt] - Instruksi sistem kepribadian bot
 * @param {string} [options.sessionId] - ID sesi percakapan unik untuk memori multi-turn
 * @param {string} [options.model='v4.1flash'] - Nama model AI (v4.1flash, deepseek-reasoner, deepseek-chat)
 * @param {boolean} [options.think=false] - Sertakan tag <think> proses reasoning
 * @param {number} [options.temperature=0.7] - Nilai kreativitas
 * @param {number} [options.maxTokens] - Maksimal token respon
 * @returns {Promise<string>}
 */
export async function callDeeperSeeker({
    prompt,
    imgUrl,
    image,
    fileUrl,
    messages,
    systemPrompt,
    sessionId,
    model = 'v4.1flash',
    think = false,
    temperature = 0.7,
    maxTokens
}) {
    const baseUrl = (config.API_AMMARICANO || DEFAULT_API_URL).replace(/\/+$/, '');
    const url = `${baseUrl}/api/ai/deeperseeker`;

    const mediaInput = imgUrl || image || fileUrl || null;
    const cleanPrompt = (prompt || '').trim();

    const payload = {
        prompt: cleanPrompt,
        systemPrompt,
        sessionId,
        model,
        think: Boolean(think),
        temperature: Number(temperature) || 0.7
    };

    if (mediaInput) {
        payload.imgUrl = mediaInput;
    }

    if (maxTokens) {
        payload.max_tokens = Number(maxTokens);
    }

    // Jika ada input media, siapkan juga format messages array
    // agar kompatibel baik dengan API lokal maupun backend DeeperSeeker langsung
    if (Array.isArray(messages) && messages.length > 0) {
        payload.messages = messages;
    } else if (mediaInput) {
        const defaultPrompt = 'Deskripsikan dan analisis gambar atau dokumen berikut secara detail.';
        payload.messages = [
            {
                role: 'user',
                content: [
                    { type: 'text', text: cleanPrompt || defaultPrompt },
                    { type: 'image_url', image_url: { url: mediaInput } }
                ]
            }
        ];
    }

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 120000 // 2 menit untuk pemrosesan file/media & reasoning
        });

        const data = response.data;
        if (!data?.success && data?.result?.error) {
            throw new Error(data.result.error);
        }

        const resResult = data?.result;
        let textResult = null;
        if (think) {
            textResult = resResult?.response || resResult?.content;
        } else {
            textResult = resResult?.content || resResult?.response;
        }

        if (!textResult && typeof resResult === 'string') {
            textResult = resResult;
        }

        if (textResult && typeof textResult === 'string') {
            return textResult.trim();
        }

        throw new Error('Format respon dari DeeperSeeker API tidak valid');
    } catch (error) {
        const dataErr = error.response?.data?.result?.error || error.response?.data?.message || error.response?.data?.detail;
        const errMsg = (typeof dataErr === 'string' ? dataErr : dataErr?.message) || error.message;
        throw new Error(`DeeperSeeker API Error: ${errMsg}`);
    }
}

export default { callDeeperSeeker };
