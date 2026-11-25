import axios from 'axios';
import * as cheerio from 'cheerio';

const SEARCH_TIMEOUT = 15000;
const FETCH_TIMEOUT = 20000;
const MAX_WEB_CONTENT_CHARS = 10000;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function isPrivateOrUnsafeHost(hostname) {
    const lower = (hostname || '').toLowerCase();
    if (!lower) return true;
    if (lower === 'localhost' || lower.endsWith('.local') || lower === '0.0.0.0') return true;
    if (/^127\./.test(lower) || /^10\./.test(lower) || /^192\.168\./.test(lower)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(lower) || /^169\.254\./.test(lower)) return true;
    if (lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:')) return true;
    return false;
}

/**
 * Mencari informasi terkini di internet via Bing Search RSS, Google News RSS, & Wikipedia API (tanpa API key)
 * @param {Object} options
 * @param {string} options.query - Kata kunci pencarian
 * @param {number} [options.maxResults=5] - Maksimal hasil
 */
export async function webSearch({ query, maxResults = 5 }) {
    if (!query || typeof query !== 'string') {
        return { error: 'Parameter query pencarian wajib diisi.' };
    }

    const limit = Math.min(Math.max(Number(maxResults) || 5, 1), 10);
    const results = [];

    // 1. Primary: Bing Web Search RSS
    try {
        const res = await axios.get('https://www.bing.com/search', {
            params: { q: query.trim(), format: 'rss' },
            headers: { 'User-Agent': USER_AGENT },
            timeout: 8000
        });

        const $ = cheerio.load(String(res.data), { xmlMode: true });
        $('item').each((_, el) => {
            if (results.length >= limit) return false;
            const title = $(el).find('title').text().trim();
            const url = $(el).find('link').text().trim();
            const snippet = $(el).find('description').text().replace(/<[^>]+>/g, '').trim();
            if (title && url) {
                results.push({ source: 'bing', title, url, snippet });
            }
        });
    } catch { }

    // 2. Fallback / Tambahan berita terkini: Google News RSS (jika Bing kosong)
    if (results.length === 0) {
        try {
            const res = await axios.get('https://news.google.com/rss/search', {
                params: { q: query.trim(), hl: 'id', gl: 'ID', ceid: 'ID:id' },
                headers: { 'User-Agent': USER_AGENT },
                timeout: 8000
            });

            const $ = cheerio.load(String(res.data), { xmlMode: true });
            $('item').each((_, el) => {
                if (results.length >= limit) return false;
                const title = $(el).find('title').text().trim();
                const url = $(el).find('link').text().trim();
                const pubDate = $(el).find('pubDate').text().trim();
                const snippet = $(el).find('description').text().replace(/<[^>]+>/g, '').trim();
                if (title && url) {
                    results.push({ source: 'google_news', title, url, snippet: pubDate ? `${pubDate} — ${snippet}` : snippet });
                }
            });
        } catch { }
    }

    // 3. Fallback pengetahuan umum: Wikipedia API (id -> en)
    if (results.length === 0) {
        for (const lang of ['id', 'en']) {
            if (results.length >= limit) break;
            try {
                const res = await axios.get(`https://${lang}.wikipedia.org/w/api.php`, {
                    params: {
                        action: 'query',
                        list: 'search',
                        srsearch: query.trim(),
                        utf8: '',
                        format: 'json',
                        srlimit: limit
                    },
                    headers: { 'User-Agent': 'NexureBot/1.0' },
                    timeout: 6000
                });

                const items = res.data?.query?.search || [];
                for (const item of items) {
                    if (results.length >= limit) break;
                    results.push({
                        source: `wikipedia_${lang}`,
                        title: item.title,
                        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
                        snippet: String(item.snippet || '').replace(/<[^>]+>/g, '').trim()
                    });
                }
            } catch { }
        }
    }

    if (results.length === 0) {
        return { query, results: [], message: 'Tidak ada hasil pencarian yang ditemukan.' };
    }

    return { query, results };
}

/**
 * Mengambil dan mengekstrak teks bersih dari sebuah URL halaman web
 * @param {Object} options
 * @param {string} options.url - URL halaman web (http/https)
 */
export async function fetchWebPage({ url }) {
    if (!url || typeof url !== 'string') {
        return { error: 'Parameter url wajib diisi.' };
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(url.trim());
    } catch {
        return { error: 'Format URL tidak valid.' };
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { error: 'Hanya URL http/https yang didukung.' };
    }

    if (isPrivateOrUnsafeHost(parsedUrl.hostname)) {
        return { error: 'Akses ke alamat jaringan lokal/privat diblokir demi keamanan.' };
    }

    try {
        const res = await axios.get(parsedUrl.toString(), {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,text/plain,application/json'
            },
            timeout: FETCH_TIMEOUT,
            maxContentLength: 2 * 1024 * 1024
        });

        const contentType = String(res.headers['content-type'] || '');
        if (contentType.includes('application/json') || typeof res.data === 'object') {
            const text = JSON.stringify(res.data, null, 2);
            return {
                url: parsedUrl.toString(),
                title: 'JSON Response',
                content: text.slice(0, MAX_WEB_CONTENT_CHARS)
            };
        }

        const $ = cheerio.load(String(res.data));
        $('script, style, noscript, iframe, svg, nav, footer, header, aside').remove();
        const title = $('title').text().trim() || parsedUrl.hostname;
        const bodyText = $('body').text()
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return {
            url: parsedUrl.toString(),
            title,
            content: bodyText.length > MAX_WEB_CONTENT_CHARS
                ? `${bodyText.slice(0, MAX_WEB_CONTENT_CHARS)}\n... [konten dipotong]`
                : bodyText
        };
    } catch (err) {
        return { error: `Gagal membuka halaman ${url}: ${err.message}` };
    }
}
