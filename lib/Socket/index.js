import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { makeCommunitiesSocket } from './communities.js';
import { AIRich } from '../MessageBuilder/AIRich.js';
// export the last socket layer
const makeWASocket = (config) => {
    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    const sock = makeCommunitiesSocket(newConfig);

    sock.createAIRich = (options = {}) => {
        return new AIRich(sock, options);
    };

    return sock;
};
export default makeWASocket;
//# sourceMappingURL=index.js.map