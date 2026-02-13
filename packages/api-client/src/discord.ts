// ============================================
// Discord API Client
// ============================================

import { api } from "./client";

export interface DiscordHandshakeResponse {
    url: string;
}

export const discordApi = {
    /**
     * Initiate Discord OAuth2 handshake
     */
    getHandshake: () => api.get<DiscordHandshakeResponse>("/discord/handshake"),

    /**
     * Unlink Discord account
     */
    unlink: () => api.delete<void>("/discord/link"),
};
