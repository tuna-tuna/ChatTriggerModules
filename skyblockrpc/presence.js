const DiscordRPC = Java.type("net.arikia.dev.drpc.DiscordRPC");
const DiscordEventHandlers = Java.type("net.arikia.dev.drpc.DiscordEventHandlers");
export const DiscordRichPresence = Java.type("net.arikia.dev.drpc.DiscordRichPresence");

export const initRichPresence = (clientID) => {
    new Thread(() => {
        handlers = new DiscordEventHandlers.Builder().build();
        DiscordRPC.discordInitialize(clientID, handlers, true);
    }).start();
};

export const exitRichPresence = () => {
    DiscordRPC.discordShutdown();
};

export const setRichPresence = (presence) => {
    DiscordRPC.discordUpdatePresence(presence);
};