export interface GroupStatusOptions {
    caption?: string;
    mimetype?: string;
    font?: number;
    backgroundArgb?: number;
    logger?: any;
}

export declare function stickerToImage(
    buffer: Buffer
): Promise<Buffer>;

export declare function stickerToVideo(
    buffer: Buffer
): Promise<Buffer>;

export declare function sendGroupStatusText(
    sock: any,
    jid: string,
    text: string,
    options?: GroupStatusOptions
): Promise<any>;

export declare function sendGroupStatusImage(
    sock: any,
    jid: string,
    image: Buffer,
    options?: GroupStatusOptions
): Promise<any>;

export declare function sendGroupStatusVideo(
    sock: any,
    jid: string,
    video: Buffer,
    options?: GroupStatusOptions
): Promise<any>;

export declare function sendGroupStatusAudio(
    sock: any,
    jid: string,
    audio: Buffer,
    options?: GroupStatusOptions
): Promise<any>;

export declare function sendGroupStatusSticker(
    sock: any,
    jid: string,
    sticker: Buffer,
    options?: GroupStatusOptions
): Promise<any>;

export declare function sendGroupStatus(
    sock: any,
    jid: string,
    type: 'text' | 'image' | 'video' | 'audio' | 'sticker',
    data: string | Buffer,
    options?: GroupStatusOptions
): Promise<any>;
