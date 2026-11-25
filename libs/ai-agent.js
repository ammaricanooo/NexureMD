import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { lookup as mimeLookup } from 'mime-types';
import { callDeeperSeeker } from './deeperseeker.js';
import { webSearch, fetchWebPage } from './ai-web-tools.js';
import { plugins } from './hot-reload.js';
import { processAuth } from '../middlewares/auth.js';
import { validatePlugin } from '../middlewares/validator.js';

const execAsync = promisify(exec);

const MAX_AGENT_STEPS = 6;
const MAX_OUTPUT_CHARS = 6000;

// Daftar command bot yang dilarang dieksekusi oleh AI untuk mencegah rekursi atau penyalahgunaan hak akses
const FORBIDDEN_BOT_COMMANDS = new Set([
    'eval', 'exec', 'delprem', 'addprem', 'backup', 'debug',
    'enable', 'disable', 'on', 'off', 'restart', 'update',
    'ai', 'agent', 'deeperseeker', 'deepseek', 'gemini', 'nexure',
    'clear', 'aiclear', 'resetai'
]);

// Daftar pola perintah shell destruktif yang diblokir demi keamanan server
const BLOCKED_COMMAND_PATTERNS = [
    /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+|-[a-zA-Z]*r[a-zA-Z]*\s+)*(\/|\/\*|\.\.)\s*$/i,
    /\brm\s+-rf\s+\/(\s|$)/i,
    /\bmkfs(\.[a-z0-9]+)?\b/i,
    /\bdd\s+if=\/dev\/(zero|random|urandom)\s+of=\/dev\/[hs]d/i,
    /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
    /\b(format|diskpart)\s+[a-z]:/i
];

function truncateText(text, maxChars = MAX_OUTPUT_CHARS) {
    if (!text) return '';
    const str = String(text);
    if (str.length <= maxChars) return str;
    return `${str.slice(0, maxChars)}\n... [output dipotong, total ${str.length} karakter]`;
}

function resolveSafePath(targetPath = '.') {
    if (!targetPath || targetPath === '.') return process.cwd();
    return path.isAbsolute(targetPath) ? targetPath : path.resolve(process.cwd(), targetPath);
}

/**
 * Tool publik yang aman digunakan untuk semua pengguna (Web Search, Fetch URL, & Eksekusi Command Bot)
 */
const PUBLIC_TOOLS = {
    async web_search({ query, maxResults = 5 }) {
        return await webSearch({ query, maxResults });
    },

    async fetch_webpage({ url }) {
        return await fetchWebPage({ url });
    },

    async run_bot_command({ command }, ctx) {
        if (!command || typeof command !== 'string') {
            return { error: 'Parameter command wajib diisi (contoh: ".tiktok https://...").' };
        }
        if (!ctx?.sock || !ctx?.m || !ctx?.msgData) {
            return { error: 'Konteks WhatsApp tidak tersedia untuk menjalankan command bot.' };
        }

        const cleaned = command.trim().replace(/^[.!#/]+/, '');
        const parts = cleaned.split(/\s+/);
        const cmdName = (parts[0] || '').toLowerCase();
        const args = parts.slice(1);

        if (!cmdName) {
            return { error: 'Nama command kosong.' };
        }

        if (FORBIDDEN_BOT_COMMANDS.has(cmdName)) {
            return { error: `Command ".${cmdName}" tidak diizinkan untuk dieksekusi otomatis oleh AI.` };
        }

        const targetPlugin = plugins.find((p) => p.command && p.command.includes(cmdName));
        if (!targetPlugin) {
            return { error: `Command ".${cmdName}" tidak ditemukan di daftar plugin bot.` };
        }

        try {
            const clonedMsgData = {
                ...ctx.msgData,
                commandName: cmdName,
                args,
                messageContent: `.${cmdName}${args.length ? ' ' + args.join(' ') : ''}`
            };

            const { user, group, setting } = await processAuth(ctx.sock, clonedMsgData);
            const isValid = await validatePlugin(ctx.sock, ctx.m, clonedMsgData, user, group, targetPlugin, setting);
            if (!isValid) {
                return { success: false, message: `Pengguna tidak memenuhi syarat izin/limit untuk menjalankan .${cmdName}.` };
            }

            await targetPlugin.execute(ctx.sock, ctx.m, clonedMsgData, user, group, plugins);
            return { success: true, executed: `.${cmdName}`, args };
        } catch (err) {
            return { error: `Gagal menjalankan .${cmdName}: ${err.message}` };
        }
    }
};

/**
 * Tool server khusus Owner Bot
 */
const OWNER_SERVER_TOOLS = {
    async run_command({ command, cwd, timeoutMs = 30000 }) {
        if (!command || typeof command !== 'string') {
            return { error: 'Parameter command wajib diisi.' };
        }

        for (const pattern of BLOCKED_COMMAND_PATTERNS) {
            if (pattern.test(command)) {
                return { error: 'Perintah diblokir oleh sistem keamanan karena berpotensi merusak sistem secara permanen.' };
            }
        }

        const workDir = cwd ? resolveSafePath(cwd) : process.cwd();
        const timeout = Math.min(Math.max(Number(timeoutMs) || 30000, 1000), 60000);

        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: workDir,
                timeout,
                maxBuffer: 1024 * 1024 * 2
            });

            return {
                success: true,
                cwd: workDir,
                stdout: truncateText(stdout?.trim() || '(kosong)'),
                stderr: stderr?.trim() ? truncateText(stderr.trim()) : ''
            };
        } catch (err) {
            return {
                success: false,
                cwd: workDir,
                exitCode: err.code ?? 1,
                stdout: truncateText(err.stdout?.trim() || ''),
                stderr: truncateText(err.stderr?.trim() || err.message)
            };
        }
    },

    async get_server_status() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const cpus = os.cpus();
        const procMem = process.memoryUsage();

        const toMB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        const toGB = (bytes) => `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;

        const formatUptime = (sec) => {
            const d = Math.floor(sec / 86400);
            const h = Math.floor((sec % 86400) / 3600);
            const m = Math.floor((sec % 3600) / 60);
            return `${d}h ${h}j ${m}m`;
        };

        return {
            hostname: os.hostname(),
            platform: `${os.platform()} (${os.release()}) ${os.arch()}`,
            cwd: process.cwd(),
            nodeVersion: process.version,
            cpuModel: cpus?.[0]?.model || 'Unknown',
            cpuCores: cpus?.length || 0,
            loadAvg: os.loadavg(),
            ram: {
                total: toGB(totalMem),
                used: toGB(usedMem),
                free: toGB(freeMem),
                usedPercent: `${((usedMem / totalMem) * 100).toFixed(1)}%`
            },
            botProcessMemory: {
                rss: toMB(procMem.rss),
                heapUsed: toMB(procMem.heapUsed),
                heapTotal: toMB(procMem.heapTotal)
            },
            systemUptime: formatUptime(os.uptime()),
            botUptime: formatUptime(process.uptime())
        };
    },

    async read_file({ path: filePath, startLine = 1, endLine = 200 }) {
        if (!filePath) return { error: 'Parameter path wajib diisi.' };
        const fullPath = resolveSafePath(filePath);
        try {
            const raw = await fs.readFile(fullPath, 'utf-8');
            const lines = raw.split(/\r?\n/);
            const start = Math.max(1, Number(startLine) || 1);
            const end = Math.min(lines.length, Number(endLine) || start + 199);
            const slice = lines.slice(start - 1, end).map((line, i) => `${start + i}: ${line}`).join('\n');

            return {
                path: fullPath,
                totalLines: lines.length,
                showing: `${start}-${end}`,
                content: truncateText(slice)
            };
        } catch (err) {
            return { error: `Gagal membaca file ${fullPath}: ${err.message}` };
        }
    },

    async write_file({ path: filePath, content }) {
        if (!filePath || content === undefined) {
            return { error: 'Parameter path dan content wajib diisi.' };
        }
        const fullPath = resolveSafePath(filePath);
        try {
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, String(content), 'utf-8');
            return { success: true, path: fullPath, bytes: Buffer.byteLength(String(content), 'utf-8') };
        } catch (err) {
            return { error: `Gagal menulis file ${fullPath}: ${err.message}` };
        }
    },

    async list_dir({ path: dirPath = '.' }) {
        const fullPath = resolveSafePath(dirPath);
        try {
            const entries = await fs.readdir(fullPath, { withFileTypes: true });
            const items = entries.slice(0, 100).map((e) => ({
                name: e.name,
                type: e.isDirectory() ? 'dir' : 'file'
            }));
            return {
                path: fullPath,
                totalItems: entries.length,
                items
            };
        } catch (err) {
            return { error: `Gagal membaca direktori ${fullPath}: ${err.message}` };
        }
    },

    async search_files({ query, dir = '.' }) {
        if (!query) return { error: 'Parameter query wajib diisi.' };
        const baseDir = resolveSafePath(dir);
        const results = [];
        const ignoreDirs = new Set(['node_modules', '.git', 'session', 'sessions', 'sessions_ai', 'dist']);

        async function walk(currentDir, depth = 0) {
            if (depth > 4 || results.length >= 40) return;
            let entries;
            try {
                entries = await fs.readdir(currentDir, { withFileTypes: true });
            } catch {
                return;
            }
            for (const entry of entries) {
                if (results.length >= 40) break;
                if (entry.isDirectory()) {
                    if (!ignoreDirs.has(entry.name)) {
                        await walk(path.join(currentDir, entry.name), depth + 1);
                    }
                } else if (/\.(js|ts|json|md|env|yml|yaml|txt|sql|py|sh|bat)$/i.test(entry.name)) {
                    const filePath = path.join(currentDir, entry.name);
                    try {
                        const stat = await fs.stat(filePath);
                        if (stat.size > 512 * 1024) continue;
                        const content = await fs.readFile(filePath, 'utf-8');
                        const lines = content.split(/\r?\n/);
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i].toLowerCase().includes(query.toLowerCase())) {
                                results.push({
                                    file: path.relative(process.cwd(), filePath),
                                    line: i + 1,
                                    preview: lines[i].trim().slice(0, 140)
                                });
                                if (results.length >= 40) break;
                            }
                        }
                    } catch { }
                }
            }
        }

        await walk(baseDir);
        return { query, baseDir, matches: results };
    },

    async send_file_to_chat({ path: filePath, caption = '' }, ctx) {
        if (!filePath) return { error: 'Parameter path wajib diisi.' };
        if (!ctx?.sock || !ctx?.remoteJid) return { error: 'Konteks WhatsApp tidak tersedia.' };

        const fullPath = resolveSafePath(filePath);
        try {
            const stat = await fs.stat(fullPath);
            if (stat.size > 50 * 1024 * 1024) {
                return { error: 'Ukuran file terlalu besar untuk dikirim ke WhatsApp (> 50 MB).' };
            }
            const buffer = await fs.readFile(fullPath);
            const fileName = path.basename(fullPath);
            const mimetype = mimeLookup(fileName) || 'application/octet-stream';

            await ctx.sock.sendMessage(ctx.remoteJid, {
                document: buffer,
                fileName,
                mimetype,
                caption: caption || `File dari server: ${fileName}`
            }, { quoted: ctx.m });

            return { success: true, sent: fileName, sizeBytes: stat.size };
        } catch (err) {
            return { error: `Gagal mengirim file ${fullPath}: ${err.message}` };
        }
    }
};

/**
 * Instruksi tool untuk disisipkan ke system prompt sesuai hak akses (Publik vs Owner)
 * @param {boolean} isOwner
 */
export function getAgentSystemInstructions(isOwner = false) {
    const publicSection = `
KEMAMPUAN TOOL PINTAR (WEB & BOT COMMAND):
Kamu punya akses ke tool nyata berikut jika dibutuhkan:
1. web_search({"query": "...", "maxResults": 5}) -> Cari informasi terbaru di internet (berita, cuaca, kurs, fakta terkini, dll).
2. fetch_webpage({"url": "https://..."}) -> Buka dan baca isi teks dari sebuah link/URL halaman web.
3. run_bot_command({"command": ".namacommand argumen"}) -> Jalankan fitur plugin bot WhatsApp secara langsung jika pengguna meminta aksi seperti download video/musik (misal ".tiktok <url>", ".ytmp3 <url>", ".play <judul>"), buat stiker (".sticker"), atau cari gambar (".pin <kata kunci>").`;

    const ownerSection = isOwner ? `

MODE AI AGENT SERVER (AKTIF — KHUSUS OWNER):
Sebagai Owner Utama, kamu juga memiliki akses penuh ke server tempat bot berjalan (OS: ${os.platform()}, CWD: ${process.cwd()}). JANGAN mengarang hasil — gunakan tool berikut:
4. get_server_status({}) -> Cek hostname, OS, CPU, RAM, uptime server, dan memori bot.
5. run_command({"command": "...", "cwd": "...", "timeoutMs": 30000}) -> Jalankan perintah terminal/shell di server.
6. read_file({"path": "...", "startLine": 1, "endLine": 200}) -> Baca isi file di server.
7. write_file({"path": "...", "content": "..."}) -> Buat atau timpa file di server.
8. list_dir({"path": "."}) -> Lihat daftar file & folder di server.
9. search_files({"query": "...", "dir": "."}) -> Cari kata/teks di dalam project server.
10. send_file_to_chat({"path": "...", "caption": "..."}) -> Kirim file dari server langsung ke chat WhatsApp ini.` : '';

    return `${publicSection}${ownerSection}

ATURAN PEMANGGILAN TOOL:
- Hanya panggil tool jika pertanyaan memang membutuhkan data internet real-time, membuka URL, menjalankan fitur bot, atau aksi server (jika hanya ngobrol biasa atau pertanyaan pengetahuan umum, jawab langsung tanpa tool).
- Saat memanggil tool, balas HANYA dengan blok XML berikut (tanpa teks lain di luar tag):
<tool_call>
{"name": "nama_tool", "arguments": {"param": "nilai"}}
</tool_call>
- Setelah tool dieksekusi, kamu akan menerima hasilnya dalam blok <tool_result>...</tool_result>.
- Maksimal ${MAX_AGENT_STEPS} langkah per giliran. Setelah informasi cukup (atau command bot sudah berhasil dieksekusi), berikan jawaban akhir yang ramah dengan gaya Nexure-Bot!`.trim();
}

/**
 * Mengekstrak pemanggilan tool dari respon teks AI
 */
function parseToolCall(responseText) {
    if (!responseText || typeof responseText !== 'string') return null;

    const xmlMatch = responseText.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/i);
    if (!xmlMatch) return null;

    let jsonStr = xmlMatch[1].trim();
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
        const parsed = JSON.parse(jsonStr);
        if (parsed && typeof parsed.name === 'string') {
            return {
                name: parsed.name.trim(),
                arguments: parsed.arguments && typeof parsed.arguments === 'object' ? parsed.arguments : {}
            };
        }
    } catch (err) {
        console.warn('[AIAgent] Gagal parse JSON tool_call:', err.message);
    }
    return null;
}

/**
 * Menjalankan ReAct Agent Loop bersama DeeperSeeker
 */
export async function runAgentLoop({
    prompt,
    imgUrl = null,
    history = [],
    systemPrompt,
    think = false,
    isOwner = false,
    sock,
    m,
    msgData,
    remoteJid
}) {
    const messages = [];

    for (const item of history) {
        const role = item.role === 'model' ? 'assistant' : 'user';
        const content = Array.isArray(item.parts)
            ? item.parts.map((p) => p.text || '').join('\n').trim()
            : (item.content || '');
        if (content) {
            messages.push({ role, content });
        }
    }

    if (imgUrl) {
        messages.push({
            role: 'user',
            content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imgUrl } }
            ]
        });
    } else {
        messages.push({ role: 'user', content: prompt });
    }

    for (let step = 1; step <= MAX_AGENT_STEPS; step++) {
        if (sock && remoteJid) {
            sock.sendPresenceUpdate('composing', remoteJid).catch(() => { });
        }

        const aiText = await callDeeperSeeker({
            messages,
            systemPrompt,
            think: step === 1 ? think : false
        });

        const toolCall = parseToolCall(aiText);
        if (!toolCall) {
            return aiText;
        }

        let toolOutput;
        const publicFn = PUBLIC_TOOLS[toolCall.name];
        const ownerFn = OWNER_SERVER_TOOLS[toolCall.name];

        if (publicFn) {
            console.log(`[AIAgent] Step ${step} eksekusi tool publik: ${toolCall.name}`, toolCall.arguments);
            toolOutput = await publicFn(toolCall.arguments, { sock, m, msgData, remoteJid });
        } else if (ownerFn) {
            if (!isOwner) {
                toolOutput = { error: `Akses ditolak: Tool "${toolCall.name}" hanya tersedia untuk Owner Bot.` };
            } else {
                console.log(`[AIAgent] Step ${step} eksekusi tool owner: ${toolCall.name}`, toolCall.arguments);
                toolOutput = await ownerFn(toolCall.arguments, { sock, m, msgData, remoteJid });
            }
        } else {
            toolOutput = { error: `Tool "${toolCall.name}" tidak dikenal.` };
        }

        messages.push({ role: 'assistant', content: aiText });
        messages.push({
            role: 'user',
            content: `<tool_result name="${toolCall.name}">\n${truncateText(JSON.stringify(toolOutput, null, 2))}\n</tool_result>\n\nGunakan hasil tool di atas untuk melanjutkan atau memberikan jawaban akhir yang rapi.`
        });
    }

    messages.push({
        role: 'user',
        content: 'Batas langkah eksekusi tercapai. Segera berikan ringkasan dan jawaban akhir berdasarkan hasil yang sudah diperoleh.'
    });

    return await callDeeperSeeker({
        messages,
        systemPrompt,
        think: false
    });
}
