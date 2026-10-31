import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import config from '../config.js';
import Setting from '../databases/orm/Setting.js';
import { isAutoAiTriggered } from './autoai.js';

const execPromise = promisify(exec);

// Membersihkan ANSI color escape codes dari output terminal
export function stripAnsi(str) {
    return (str || '').replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

/**
 * Mencari path binary hermes di berbagai lokasi umum di Linux / Windows
 */
export function findHermesBinary() {
    const home = os.homedir();
    const isWindows = process.platform === 'win32';
    const ext = isWindows ? '.exe' : '';

    const candidates = [
        path.join(home, '.local', 'bin', `hermes${ext}`),
        path.join(home, '.cargo', 'bin', `hermes${ext}`),
        path.join(home, '.hermes', 'bin', `hermes${ext}`),
        path.join(home, 'hermes-agent', 'venv', 'bin', `hermes${ext}`),
        path.join('/usr', 'local', 'bin', `hermes${ext}`),
        path.join('/usr', 'bin', `hermes${ext}`),
    ];

    for (const candidate of candidates) {
        try {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        } catch (_) {}
    }

    return 'hermes';
}

/**
 * Menjalankan perintah Hermes Agent via CLI
 */
export async function runHermes(prompt, { cwd = process.cwd(), timeout = 180000 } = {}) {
    const tempDir = path.join(os.tmpdir(), 'hermes-wa');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const queryFilePath = path.join(tempDir, `query-${Date.now()}-${Math.random().toString(36).substring(7)}.txt`);
    const hermesBin = findHermesBinary();

    // Pastikan PATH mencakup folder tempat instalasi Hermes di Linux (~/.local/bin, ~/.cargo/bin)
    const home = os.homedir();
    const extraPaths = [
        path.join(home, '.local', 'bin'),
        path.join(home, '.cargo', 'bin'),
        path.join(home, '.hermes', 'bin'),
        path.join(home, 'hermes-agent', 'venv', 'bin'),
        '/usr/local/bin',
        '/usr/bin',
        '/bin'
    ];

    const currentPath = process.env.PATH || '';
    const enhancedPath = extraPaths.concat(currentPath.split(path.delimiter)).filter(Boolean).join(path.delimiter);

    const env = {
        ...process.env,
        PATH: enhancedPath,
        HERMES_YOLO_MODE: '1', // Otomatis bypass konfirmasi tool approval di server unattended
        PYTHONUNBUFFERED: '1',
    };

    try {
        await fs.promises.writeFile(queryFilePath, prompt, 'utf8');

        // --yolo agar tidak hang meminta konfirmasi interaktif [y/N]
        const cmd = `"${hermesBin}" chat --yolo --query-file "${queryFilePath}"`;

        const { stdout, stderr } = await execPromise(cmd, {
            cwd,
            timeout,
            maxBuffer: 1024 * 1024 * 20,
            env,
        });

        const rawOutput = (stdout || '') + (stderr ? `\n\n[Stderr Output]:\n${stderr}` : '');
        return {
            success: true,
            output: stripAnsi(rawOutput).trim(),
        };
    } catch (error) {
        console.error('[Hermes Run Error Detail]:', {
            message: error.message,
            stderr: error.stderr,
            stdout: error.stdout,
            code: error.code,
        });

        const isNotFound = error.message?.includes('not found') ||
                           error.message?.includes('is not recognized') ||
                           error.code === 127;

        const combinedError = [
            error.stderr ? `[STDERR]:\n${error.stderr}` : '',
            error.stdout ? `[STDOUT]:\n${error.stdout}` : '',
            `[MESSAGE]: ${error.message || 'Unknown Error'}`
        ].filter(Boolean).join('\n\n');

        return {
            success: false,
            isNotFound,
            error: stripAnsi(combinedError).trim(),
        };
    } finally {
        try {
            if (fs.existsSync(queryFilePath)) {
                await fs.promises.unlink(queryFilePath);
            }
        } catch (_) {}
    }
}

/**
 * Handler pesan otomatis untuk Agent Mode (Khusus Owner)
 * Jika aktif, pesan teks dari owner akan langsung diproses oleh Hermes Agent tanpa perlu command prefix.
 */
export async function handleAgentMessage(sock, m, msgData) {
    try {
        const text = msgData.messageContent?.trim();
        if (!text) return false;

        // 1. Verifikasi ketat: Hanya nomor Owner yang boleh memicu
        const ownerNum = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace(/[^0-9]/g, '') : '';
        const botNum = sock?.user?.id ? sock.user.id.split(':')[0].split('@')[0] : '';
        const senderNum = msgData.senderJid ? msgData.senderJid.split(':')[0].split('@')[0] : '';
        const isOwner = (senderNum === ownerNum) || (senderNum === botNum) || msgData.fromMe;

        if (!isOwner) return false;

        // 2. Cek apakah fitur is_agent aktif di database
        const setting = await Setting.findByPk(1);
        if (!setting?.is_agent) return false;

        // 3. Jika di dalam grup, hanya aktifkan saat owner me-mention atau me-reply bot
        if (msgData.isGroup) {
            const trigger = isAutoAiTriggered(sock, msgData);
            if (!trigger.isTriggered) return false;
        }

        // Cek pintasan teks untuk mematikan mode agent tanpa command prefix
        const lower = text.toLowerCase();
        if (lower === 'disable agent' || lower === 'off agent') {
            await setting.update({ is_agent: false });
            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });
            await sock.sendMessage(msgData.remoteJid, {
                text: `Selesai! *Mode Agent* telah dinonaktifkan. Nexure kembali ke mode normal.`
            }, { quoted: m });
            return true;
        }

        // Bersihkan mention bot dari prompt jika di grup
        let prompt = text;
        const rawBotId = sock?.user?.id || '';
        const rawBotLid = sock?.user?.lid || '';
        const botIdentifiers = [botNum, rawBotLid.split(':')[0].split('@')[0], config.BOT_NUMBER].filter(Boolean);
        for (const bId of botIdentifiers) {
            prompt = prompt.replace(new RegExp(`@${bId}\\b`, 'gi'), '').trim();
        }

        if (!prompt) return false;

        // Beri indikator bahwa agent sedang bekerja
        await sock.sendMessage(msgData.remoteJid, { react: { text: '🧠', key: m.key } });
        await sock.sendMessage(msgData.remoteJid, {
            text: `🧠 *[Agent Mode Active]* Hermes Agent sedang mengeksekusi instruksi di server...\n\n_Mohon tunggu sebentar..._`
        }, { quoted: m });

        const result = await runHermes(prompt);

        if (result.success) {
            await sock.sendMessage(msgData.remoteJid, { react: { text: '✅', key: m.key } });

            const output = result.output || 'Tugas telah selesai dijalankan (tanpa output teks).';
            let messageText = `⚡ *HASIL HERMES AGENT* ⚡\n\n${output}`;
            if (messageText.length > 4000) {
                messageText = `⚡ *HASIL HERMES AGENT* ⚡\n\n${output.slice(0, 3800)}\n\n_... (output dipotong karena batas panjang pesan WhatsApp)_`;
            }

            await sock.sendMessage(msgData.remoteJid, { text: messageText }, { quoted: m });
        } else {
            await sock.sendMessage(msgData.remoteJid, { react: { text: '❌', key: m.key } });

            let errorResponse = `❌ *Gagal Menjalankan Hermes Agent*\n\n`;
            if (result.isNotFound) {
                errorResponse += `Hermes CLI belum terpasang atau belum masuk PATH di server!\n\n` +
                                 `*Cara Pasang di Server (Linux/VPS):*\n` +
                                 `1. \`curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash\`\n` +
                                 `2. \`source ~/.bashrc\`\n` +
                                 `3. \`hermes setup\`\n\n` +
                                 `Setelah selesai setup, fitur ini siap digunakan langsung dari WhatsApp.`;
            } else {
                errorResponse += `*Detail Error:*\n\`\`\`\n${result.error.slice(0, 1500)}\n\`\`\``;
            }

            await sock.sendMessage(msgData.remoteJid, { text: errorResponse }, { quoted: m });
        }

        return true;
    } catch (err) {
        console.error('[Agent Handler Error]:', err);
        return false;
    }
}
