/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import PogObject from "PogData";

import { SkyblockArea } from "./constant";
import {
    DiscordRichPresence,
    exitRichPresence,
    initRichPresence,
    setRichPresence,
} from "./presence";

const File = Java.type("java.io.File");

// global vars
let onSkyblockCheck = false;
let isOnSkyblock = false;
let previousIsland = '';
let previousRegion = '';
let constantUpdateTrigger, worldLoadTrigger;


let data = new PogObject("skyblockrpc", {
    is_on: false
}, "playerData.json");

const fileExists = (loc) => {
    const file = new File(loc);
    return file.exists();
}

if (!fileExists("./config/ChatTriggers/modules/skyblockrpc/playerData.json")) {
    data.save();
}

register("command", (val) => {
    if (!val) {
        ChatLib.chat("§cCannot find the value!");
        return;
    }
    let formattedVal;
    if (val == "on" || val == "true") {
        formattedVal = true;
    } else if (val == "off" || val == "false") {
        formattedVal = false;
    }
    data.is_on = formattedVal;
    data.save();
    ChatLib.chat(`§aRPC set to ${val}!`);
}).setCommandName("rpcset");

const getLocation = () => {
    let location = 'Unknown';
    Scoreboard.getLines().forEach(line => {
        let lineRaw = line.toString().removeFormatting().replace(/[^A-Za-z0-9⏣ \[\]'+]/g, "");
        if (lineRaw.match('⏣') !== null) {
            location = line.toString().removeFormatting().replace(/[^A-Za-z0-9 \[\]'+]/g, "").trim();
        }
    });
    return location;
}

const getFormattedAreaString = (rawval) => {
    let text = '';
    Object.keys(SkyblockArea).forEach((key) => {
        SkyblockArea[key].map((val) => {
            if (rawval == val) {
                text = key + ' - ' + val;
            }
        });
    });
    if (text === '') return rawval;
    return text;
}

const getAreaImageString = (rawval) => {
    if (rawval === 'Your Island') {
        rawval = 'Private Island';
    }
    rawval = rawval.toLowerCase().replace(' ', '_').replace('\'', '_');
    return rawval;
}

const getRegion = (rawval) => {
    let text = '';
    Object.keys(SkyblockArea).forEach((key) => {
        SkyblockArea[key].map((val) => {
            if (rawval == val) {
                text = key;
            }
        });
    });
    if (text === '') return 'unknown';
    return text;
}

const initialize = () => {
    initRichPresence("1070995228045086761");
    constantUpdateTrigger = register("step", () => updatePresence()).setDelay(10);
    worldLoadTrigger = register("worldLoad", () => updatePresence(false));
}

const onJoinSkyblockIsland = () => {
    if (!isOnSkyblock) {
        isOnSkyblock = true;
        initialize();
    }
}

const updatePresence = (check = true) => {
    if (!Scoreboard.getTitle().toString().removeFormatting().match('SKYBLOCK') && check) {
        if (onSkyblockCheck)
            exitRichPresence();
        onSkyblockCheck = true;
    } else {
        onSkyblockCheck = false;
        onJoinSkyblockIsland();
        const currentIsland = getLocation();
        const currentRegion = getRegion(currentIsland);
        if (previousIsland !== currentIsland) {
            previousIsland = currentIsland;
            const presence = new DiscordRichPresence();
            presence.details = getFormattedAreaString(currentIsland);
            presence.state = 'Playing Skyblock'
            presence.startTimestamp = Date.now();
            if (previousRegion !== currentRegion) {
                // gonna fix it with timestamp things
                previousRegion = currentRegion;
            }
            presence.largeImageKey = getAreaImageString(currentIsland);
            presence.largeImageText = currentIsland;
            setRichPresence(presence);
        }
    }
}

register("serverConnect", () => initialize());
register("gameLoad", () => initialize());
register("serverDisconnect", () => {
    try {
        isOnSkyblock = false;
        constantUpdateTrigger.unregister();
        worldLoadTrigger.unregister();
        exitRichPresence();
    } catch (error) {
        console.log("Error");
    }
});