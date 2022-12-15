/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as dotenv from "dotenv";
dotenv.config();

import { NostaleBot, NostaleEmoji } from "@gorlikitsme/nosbot.js";

interface PlayerPos {
    id: number;
    x: number;
    y: number;
}
const playersPositions: PlayerPos[] = [];
function updatePlayerPos(characterId: number, x: number, y: number) {
    const index = playersPositions.findIndex((a) => a.id == characterId);
    if (index != -1) {
        playersPositions[index].x = x;
        playersPositions[index].y = y;
    } else {
        playersPositions.push({
            id: characterId,
            x: x,
            y: y,
        });
    }
}
function getPlayerPos(characterId: number) {
    return playersPositions.find((a) => a.id == characterId);
}

const bot = new NostaleBot({
    auth: {
        type: "priv",
        login: process.env.AUTH_LOGIN!,
        password: process.env.AUTH_PASSWORD!,
    },
    loginServer: {
        ip: process.env.LOGIN_SERVER_IP!,
        port: parseInt(process.env.LOGIN_SERVER_PORT!),
    },
    worldServer: {
        ip: process.env.WORLD_SERVER_IP!,
        port: parseInt(process.env.WORLD_SERVER_PORT!),
    },
    extra: {
        nosvoidPin: "123456789",
    },
    game: {
        installationId: process.env.INSTALLATION_ID!,
        nostaleClientXVersion: "0.9.3.3087",
        nostaleClientXMd5Hash: "x",
        nostaleClientMd5Hash: "x",
    },
});

function walkTo(bot: NostaleBot, x: number, y: number, speed = 13) {
    const w = ((x + y) % 3) % 2;
    bot.sendPacket(`walk ${x} ${y} ${w} ${speed}`);
}

bot.on("eff", (packet) => {
    // eff 1 14187 5073
    const p = packet.split(" ");
    if (p[1] != "1") return;
    if (p[2] == `${bot.currentCharacter.id}`) return;
    if (p[3] != "5073") return;

    const a = getPlayerPos(parseInt(p[2]));
    if (!a) return;

    bot.useEmoji(NostaleEmoji.AltW);
    console.log(`Go to ${a.x} ${a.y}`);
    walkTo(bot, a.x, a.y);
    bot.close();
});

bot.on("mv", (packet) => {
    const p = packet.split(" ");
    const characterId = parseInt(p[2]);
    const x = parseInt(p[3]);
    const y = parseInt(p[4]);
    updatePlayerPos(characterId, x, y);
});

bot.on("in", (packet) => {
    const p = packet.split(" ");
    if (p[1] == "1") {
        const characterId = p[4];
        const x = p[5];
        const y = p[6];
        updatePlayerPos(characterId, x, y);
    }
});
bot.login();
