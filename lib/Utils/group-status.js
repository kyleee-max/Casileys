import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import crypto from 'crypto';

import ff from 'fluent-ffmpeg';
import webpMux from 'node-webpmux';

import { prepareWAMessageMedia } from './messages.js';

try {
    const ffmpegInstaller = await import('@ffmpeg-installer/ffmpeg');
    ff.setFfmpegPath(ffmpegInstaller.path);
} catch {
    // Fallback to ffmpeg available in system PATH.
}

const TEMP_DIR = path.join(tmpdir(), 'casileys-group-status');

const ensureTempDir = async () => {
    await fs.mkdir(TEMP_DIR, { recursive: true });
};

const randomId = () =>
    crypto.randomBytes(8).toString('hex');

const toNumber = (value) => {
    if (typeof value === 'number') {
        return value;
    }

    if (value && typeof value === 'object' && 'low' in value) {
        return value.low;
    }

    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
};

/**
 * Convert a static WebP sticker into PNG.
 */
export const stickerToImage = async (buffer) => {
    await ensureTempDir();

    const id = randomId();
    const input = path.join(TEMP_DIR, `${id}.webp`);
    const output = path.join(TEMP_DIR, `${id}.png`);

    fsSync.writeFileSync(input, buffer);

    try {
        await new Promise((resolve, reject) => {
            ff(input)
                .frames(1)
                .output(output)
                .on('error', reject)
                .on('end', resolve)
                .run();
        });

        return fsSync.readFileSync(output);
    } finally {
        try {
            fsSync.unlinkSync(input);
        } catch {}

        try {
            fsSync.unlinkSync(output);
        } catch {}
    }
};

/**
 * Convert an animated WebP sticker into MP4.
 */
export const stickerToVideo = async (buffer) => {
    await ensureTempDir();

    const id = randomId();
    const frameDir = path.join(TEMP_DIR, `webp-${id}`);
    const output = path.join(TEMP_DIR, `${id}.mp4`);

    fsSync.mkdirSync(frameDir, { recursive: true });

    try {
        const image = new webpMux.Image();

        await image.load(buffer);

        if (!image.hasAnim) {
            throw new Error('Bukan sticker animasi');
        }

        const frames = await image.demux({
            buffers: true
        });

        if (!frames?.length) {
            throw new Error('Tidak ada frame sticker yang ditemukan');
        }

        const delay =
            image.anim?.frames?.[0]?.delay || 100;

        const fps = Math.max(
            1,
            Math.round(1000 / delay)
        );

        for (let index = 0; index < frames.length; index++) {
            const framePath = path.join(
                frameDir,
                `frame${String(index).padStart(5, '0')}.webp`
            );

            fsSync.writeFileSync(
                framePath,
                frames[index]
            );
        }

        await new Promise((resolve, reject) => {
            ff()
                .input(
                    path.join(
                        frameDir,
                        'frame%05d.webp'
                    )
                )
                .inputOptions([
                    '-framerate',
                    String(fps)
                ])
                .outputOptions([
                    '-c:v',
                    'libx264',

                    '-pix_fmt',
                    'yuv420p',

                    '-vf',
                    "scale='if(mod(iw,2),iw-1,iw)':'if(mod(ih,2),ih-1,ih)'",

                    '-movflags',
                    '+faststart'
                ])
                .toFormat('mp4')
                .on('error', reject)
                .on('end', resolve)
                .save(output);
        });

        return fsSync.readFileSync(output);
    } finally {
        try {
            fsSync.rmSync(
                frameDir,
                {
                    recursive: true,
                    force: true
                }
            );
        } catch {}

        try {
            fsSync.unlinkSync(output);
        } catch {}
    }
};

/**
 * Send plain text as a group status.
 */
export const sendGroupStatusText = async (
    sock,
    jid,
    text,
    options = {}
) => {
    if (!text || typeof text !== 'string') {
        throw new Error('Text status harus berupa string');
    }

    await sock.relayMessage(
        jid,
        {
            groupStatusMessageV2: {
                message: {
                    extendedTextMessage: {
                        text,
                        font: options.font ?? 1,
                        backgroundArgb:
                            options.backgroundArgb ??
                            0xff000000
                    }
                }
            }
        },
        {}
    );
};

/**
 * Send image as a group status.
 */
export const sendGroupStatusImage = async (
    sock,
    jid,
    image,
    options = {}
) => {
    const prepared = await prepareWAMessageMedia(
        {
            image,
            ...(options.mimetype
                ? { mimetype: options.mimetype }
                : {})
        },
        {
            upload: sock.waUploadToServer,
            logger: options.logger
        }
    );

    const imageMessage = {
        ...prepared.imageMessage
    };

    if (options.caption) {
        imageMessage.caption = options.caption;
    }

    await sock.relayMessage(
        jid,
        {
            groupStatusMessageV2: {
                message: {
                    imageMessage
                }
            }
        },
        {}
    );
};

/**
 * Send video as a group status.
 */
export const sendGroupStatusVideo = async (
    sock,
    jid,
    video,
    options = {}
) => {
    const prepared = await prepareWAMessageMedia(
        {
            video,
            ...(options.mimetype
                ? { mimetype: options.mimetype }
                : {})
        },
        {
            upload: sock.waUploadToServer,
            logger: options.logger
        }
    );

    const videoMessage = {
        ...prepared.videoMessage
    };

    if (options.caption) {
        videoMessage.caption = options.caption;
    }

    await sock.relayMessage(
        jid,
        {
            groupStatusMessageV2: {
                message: {
                    videoMessage
                }
            }
        },
        {}
    );
};

/**
 * Send audio as a group status.
 */
export const sendGroupStatusAudio = async (
    sock,
    jid,
    audio,
    options = {}
) => {
    const prepared = await prepareWAMessageMedia(
        {
            audio,
            mimetype:
                options.mimetype ||
                'audio/mpeg',
            ptt: true
        },
        {
            upload: sock.waUploadToServer,
            logger: options.logger
        }
    );

    const audioMessage = {
        ...prepared.audioMessage
    };

    audioMessage.fileLength =
        toNumber(audioMessage.fileLength);

    audioMessage.mediaKeyTimestamp =
        toNumber(audioMessage.mediaKeyTimestamp);

    if (
        typeof audioMessage.seconds === 'string'
    ) {
        audioMessage.seconds =
            toNumber(audioMessage.seconds);
    }

    audioMessage.ptt = true;

    audioMessage.contextInfo = {
        ...(audioMessage.contextInfo || {}),
        isGroupStatus: true
    };

    audioMessage.waveform =
        audioMessage.waveform ||
        Buffer.from([]);

    audioMessage.backgroundArgb =
        options.backgroundArgb ??
        0xff000000;

    await sock.relayMessage(
        jid,
        {
            groupStatusMessageV2: {
                message: {
                    audioMessage
                }
            }
        },
        {}
    );
};

/**
 * Send a sticker as a group status.
 *
 * Static WebP  -> PNG image
 * Animated WebP -> MP4 video
 */
export const sendGroupStatusSticker = async (
    sock,
    jid,
    sticker,
    options = {}
) => {
    const image = new webpMux.Image();

    await image.load(sticker);

    if (image.hasAnim) {
        const video = await stickerToVideo(
            sticker
        );

        return sendGroupStatusVideo(
            sock,
            jid,
            video,
            {
                ...options,
                mimetype:
                    options.mimetype ||
                    'video/mp4'
            }
        );
    }

    const png = await stickerToImage(
        sticker
    );

    return sendGroupStatusImage(
        sock,
        jid,
        png,
        {
            ...options,
            mimetype:
                options.mimetype ||
                'image/png'
        }
    );
};

/**
 * Send group status media based on type.
 *
 * Supported types:
 * - text
 * - image
 * - video
 * - audio
 * - sticker
 */
export const sendGroupStatus = async (
    sock,
    jid,
    type,
    data,
    options = {}
) => {
    switch (type) {
        case 'text':
            return sendGroupStatusText(
                sock,
                jid,
                data,
                options
            );

        case 'image':
            return sendGroupStatusImage(
                sock,
                jid,
                data,
                options
            );

        case 'video':
            return sendGroupStatusVideo(
                sock,
                jid,
                data,
                options
            );

        case 'audio':
            return sendGroupStatusAudio(
                sock,
                jid,
                data,
                options
            );

        case 'sticker':
            return sendGroupStatusSticker(
                sock,
                jid,
                data,
                options
            );

        default:
            throw new Error(
                `Unsupported group status type: ${type}`
            );
    }
};
