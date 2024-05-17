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
        return `Connecting to WorldServer (${chan.ip}:${chan.port} CH:${chan.channelId})...`;
    }

    if ("channelId" in worldServer) {
        const pickChannelId = worldServer.channelId;
        // pick channel by id
        const foundChannel = nstest.channels.find((v) => v.channelId == pickChannelId);

        if (foundChannel !== undefined) {
            // conect using channel ID
            logger.info(conMsg(foundChannel));
            return [foundChannel.ip, foundChannel.port];
        }

        // channel not found soo lista all channels and pick first
        logger.warn(`Channel with id ${worldServer.channelId} not found`);

        logger.info("Channels: ");
        nstest.channels.forEach((c) => {
            logger.info(`${c.channelId}. ${c.ip}:${c.port} ${c.worldId}.${c.name}`);
        });

        const firstChan = nstest.channels[0];
        logger.info(conMsg(firstChan));
        return [firstChan.ip, firstChan.port];
    }

    // connect using ip and port
    logger.info(`Connecting to WorldServer (${worldServer.ip}:${worldServer.port})...`);
    return [worldServer.ip, worldServer.port];
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
