import { createLogger } from "../logger";
import { type NostaleBot } from "../NostaleBot";
import { PacketNsTeST, PacketNsTeST_Channel } from "../PacketHandler/nstest";
import {
    createLoginPacketNos0577,
    createLoginPacketPrivServer,
} from "../utils/createLoginPacket";

const logger = createLogger("NostaleBot");

export function sendLoginPacket(bot: NostaleBot): void {
    if (bot.config.auth.type == "priv") {
        const packet = createLoginPacketPrivServer(
            bot.config.auth.login,
            bot.config.auth.password,
            bot.config.game.installationId,
            bot.config.game.nostaleClientXMd5Hash,
            bot.config.game.nostaleClientMd5Hash,
            bot.config.game.nostaleClientXVersion
        );
        return bot.sendPacket(packet);
    } else if (bot.config.auth.type == "custom") {
        bot.sendPacket(bot.config.auth.customLoginPacket);
    } else if (bot.config.auth.type == "NoS0577_with_token") {
        const packet = createLoginPacketNos0577(
            bot.config.auth.token,
            bot.config.game.installationId,
            bot.config.game.nostaleClientXMd5Hash,
            bot.config.game.nostaleClientMd5Hash,
            bot.config.game.nostaleClientXVersion
        );
        return bot.sendPacket(packet);
    } else {
        throw new Error(`Not implemented, login for bot auth.type`);
    }
}

/** Will return IP and PORT for channel to connect
 * checks what channels are avaible, what is in config, etc
 */
export function pickWorldServer(bot: NostaleBot, nstest: PacketNsTeST): [string, number] {
    const worldServer = bot.config.worldServer;

    function conMsg(chan: PacketNsTeST_Channel) {
        return `Connecting to WorldServer ${chan.name} CH:${chan.channelId} (${chan.ip}:${chan.port})...`;
    }

    if ("ip" in worldServer && "port" in worldServer) {
        const chan = nstest.channels.find(
            (v) => v.ip === worldServer.ip && v.port === worldServer.port
        );
        if (chan) {
            logger.info(conMsg(chan));
            return [chan.ip, chan.port];
        }
        logger.info(`Connecting to WorldServer (${worldServer.ip}:${worldServer.port})...`);
        return [worldServer.ip, worldServer.port];
    }

    const recommendedWorldId = nstest.channels.find(
        (a) => worldServer.byServerName && a.name.startsWith(worldServer.byServerName)
    );

    if ("channelId" in worldServer) {
        const pickChannelId = worldServer.channelId;

        // pick channel by id
        const channelList = nstest.channels.filter((v) => {
            if (recommendedWorldId) {
                return v.channelId == pickChannelId && v.worldId == recommendedWorldId.worldId;
            }
            return v.channelId == pickChannelId;
        });
        if (channelList.length > 1) {
            const uniqueWorldNames = Array.from(new Set(channelList.map((a) => a.name)));
            logger.error(
                `Multiple channels with id ${pickChannelId} found. You should add worldServer.byServerName to the config\n
                Posible servers: ${uniqueWorldNames.join(", ")}`
            );
            throw new Error(`Multiple channels with id ${pickChannelId} found. You should add worldServer.byServerName to the config\n
            Posible servers: ${uniqueWorldNames.join(", ")}`);
        }
        if (channelList.length === 0) {
            logger.error(`Channel with id ${pickChannelId} not found. Here is a list of all channels:\n
            ${nstest.channels
                .map((a) => `${a.worldId} ${a.name} Ch:${a.channelId} (${a.ip}:${a.port})`)
                .join("\n")}`);
            throw new Error(`Channel with id ${pickChannelId} not found`);
        }

        const foundChannel = channelList[0];
        logger.info(conMsg(foundChannel));
        return [foundChannel.ip, foundChannel.port];
    }

    throw new Error("Unexpected error, check your config.worldServer settings");
}

/**
 * Return charId used in select packet during selecting character
 * @param bot NostaleBot
 */
export function selectCharacter(bot: NostaleBot): number {
    const selCharConf = bot.config.selectCharacter;
    if (selCharConf == undefined) {
        logger.warn("You have not selected a character to log. I will choose the first one");
        return bot.characterList[0].id;
    } else if ("byId" in selCharConf) {
        const charById = bot.characterList.find((a) => a.id === selCharConf.byId);
        if (charById) {
            return charById.id;
        } else {
            logger.warn(
                `Character with id ${selCharConf.byId} dont exits. Picking first one...`
            );
            return bot.characterList[0].id;
        }
    } else if ("byName" in selCharConf) {
        const charByName = bot.characterList.find(
            (a) => a.name.toLowerCase() === selCharConf.byName.toLowerCase()
        );
        if (charByName) {
            return charByName.id;
        } else {
            logger.warn(
                `Character with id ${selCharConf.byName} dont exits. Picking first one...`
            );
            return bot.characterList[0].id;
        }
    } else {
        logger.warn("You have not selected a character to log. I will choose the first one");
        return bot.characterList[0].id;
    }
}
