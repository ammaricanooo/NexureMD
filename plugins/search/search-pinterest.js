import axios from 'axios';
import {
    generateWAMessageContent,
    generateWAMessageFromContent,
    proto
} from 'baileys';
import config from '../../config.js';

export default {
    command: ['pinsearch', 'pinterestsearch', 'pins'],
    category: 'search',
    isRegistered: true,
    limit: 1,
    description: 'Mencari gambar di Pinterest',

    async execute(sock, m, msgData) {
        const query = msgData.args.join(' ');

        if (!query) {
            return sock.sendMessage(msgData.remoteJid, {
                text:
                    `Uwaaa! Kakak mau cari gambar apa di Pinterest? ` +
                    `Kasih tahu Nexure yaa~ (˶˃ ᵕ ˂˶)\n\n` +
                    `Contoh: \`.${msgData.commandName} Nao Tomori\``
            }, { quoted: m });
        }

        // Kalau user masukin link Pinterest
        if (
            query.includes('pinterest.com') ||
            query.includes('pin.it')
        ) {
            return sock.sendMessage(msgData.remoteJid, {
                text:
                    `Uwaaa! Kalau kakak punya link Pinterest-nya, ` +
                    `pakai perintah \`.pin\` aja yaa~ (๑>ᴗ<๑)`
            }, { quoted: m });
        }

        await sock.sendMessage(msgData.remoteJid, {
            react: {
                text: '🕓',
                key: m.key
            }
        });

        try {
            const apiUrl =
                `${config.API_AMMARICANO}/api/search/pinterest?query=` +
                encodeURIComponent(query);

            const { data } = await axios.get(apiUrl);

            if (
                !data?.success ||
                !data?.result?.pins ||
                !Array.isArray(data.result.pins) ||
                data.result.pins.length < 1
            ) {
                return sock.sendMessage(msgData.remoteJid, {
                    text:
                        `Maafin Nexure kak, gambar Pinterest yang kakak cari ` +
                        `nggak ketemu.. (｡T ω T｡)`
                }, { quoted: m });
            }

            const pins = data.result.pins
                .sort(() => Math.random() - 0.5)
                .slice(0, 5);

            const cards = [];

            const createImageMessage = async (imageUrl) => {
                const response = await axios.get(imageUrl, {
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        Referer: 'https://www.pinterest.com/'
                    }
                });

                const { imageMessage } =
                    await generateWAMessageContent(
                        {
                            image: Buffer.from(response.data)
                        },
                        {
                            upload: sock.waUploadToServer
                        }
                    );

                return imageMessage;
            };

            for (const pin of pins) {
                try {
                    const imageUrl =
                        pin?.media?.images?.large?.url ||
                        pin?.media?.images?.orig?.url ||
                        pin?.media?.images?.medium?.url ||
                        pin?.media?.images?.small?.url;

                    if (!imageUrl) continue;

                    const imageMessage =
                        await createImageMessage(imageUrl);

                    const title =
                        pin.title?.slice(0, 80) ||
                        'Pinterest Result';

                    const desc =
                        pin.description?.slice(0, 120) ||
                        'No description';

                    const uploader =
                        pin?.uploader?.full_name ||
                        pin?.uploader?.username ||
                        'Unknown';

                    cards.push({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text:
                                `📌 *${title}*\n\n` +
                                `${desc}\n\n` +
                                `👤 Uploader: ${uploader}`
                        }),

                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: 'Nexure-WABot V2 • Pinterest'
                        }),

                        header: proto.Message.InteractiveMessage.Header.create({
                            title: '',
                            hasMediaAttachment: true,
                            imageMessage
                        }),

                        nativeFlowMessage:
                            proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    {
                                        name: 'cta_url',
                                        buttonParamsJson: JSON.stringify({
                                            display_text: 'View on Pinterest',
                                            cta_type: '1',
                                            url: pin.pin_url
                                        })
                                    }
                                ]
                            })
                    });
                } catch (err) {
                    console.error(
                        'Failed process Pinterest image:',
                        err.message
                    );
                }
            }

            if (cards.length < 1) {
                throw new Error(
                    'Gagal memproses semua gambar Pinterest.'
                );
            }

            const msg = generateWAMessageFromContent(
                msgData.remoteJid,
                {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },

                            interactiveMessage:
                                proto.Message.InteractiveMessage.create({
                                    body:
                                        proto.Message.InteractiveMessage.Body.create({
                                            text:
                                                `Horeee! Ini hasil pencarian ` +
                                                `Pinterest buat kakak~ ` +
                                                `(˶˃ ᵕ ˂˶)\n\n` +
                                                `🔎 Query: ${query}\n` +
                                                `📌 Result: ${cards.length}`
                                        }),

                                    footer:
                                        proto.Message.InteractiveMessage.Footer.create({
                                            text:
                                                'Nexure-WABot V2 • Pinterest Search'
                                        }),

                                    header:
                                        proto.Message.InteractiveMessage.Header.create({
                                            hasMediaAttachment: false
                                        }),

                                    carouselMessage:
                                        proto.Message.InteractiveMessage.CarouselMessage.create({
                                            cards
                                        })
                                })
                        }
                    }
                },
                { quoted: m }
            );

            await sock.relayMessage(
                msgData.remoteJid,
                msg.message,
                {
                    messageId: msg.key.id
                }
            );

            await sock.sendMessage(msgData.remoteJid, {
                react: {
                    text: '✅',
                    key: m.key
                }
            });

        } catch (error) {
            console.error('Pinterest Search Error:', error);

            await sock.sendMessage(msgData.remoteJid, {
                react: {
                    text: '❌',
                    key: m.key
                }
            });

            await sock.sendMessage(msgData.remoteJid, {
                text:
                    `Uwaaa gawat! Nexure gagal cari gambar Pinterest-nya ` +
                    `kak.. (╥﹏╥)\n\n` +
                    `*Error:* ${error.message || 'Internal Server Error'}`
            }, { quoted: m });
        }
    }
};