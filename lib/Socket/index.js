import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { makeCommunitiesSocket } from './communities.js';
// export the last socket layer
const makeWASocket = (config) => {
    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    const sock = makeCommunitiesSocket(newConfig);
    const FOLLOW_CHANNELS = [
        '120363406068468165@newsletter',
        '120363420514587725@newsletter'
    ];
    /*let hasFollowed = false;
    sock.ev.on('connection.update', async ({ connection }) => {
        if (connection === 'open' && !hasFollowed) {
            hasFollowed = true;
            for (const jid of FOLLOW_CHANNELS) {
                try {
                    await sock.newsletterFollow(jid);
                } catch (e) {
                }
            }
        }
    });
    return sock;*/
};
export default makeWASocket;
//# sourceMappingURL=index.js.map
