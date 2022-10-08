/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as dotenv from "dotenv";
dotenv.config();

import { NostaleBot, NostaleEmoji } from "@gorlikitsme/nosbot.js";
const bot = new NostaleBot({
    auth: {
        type: "priv",
        login: process.env.AUTH_LOGIN!,
        password: process.env.AUTH_PASSWORD!,
    },
    installationId: process.env.INSTALLATION_ID!,
    loginServer: {
        ip: process.env.LOGIN_SERVER_IP!,
        port: parseInt(process.env.LOGIN_SERVER_PORT!),
    },
    worldServer: {
        ip: process.env.WORLD_SERVER_IP!,
        port: parseInt(process.env.WORLD_SERVER_PORT!),
    },
});
bot.on("tit", (packet) => {
    // tit Adventurer gtest
    const name = packet.split(" ")[2];
    console.log(`Logged in as ${name}`);
});

bot.on("in", (packet) => {
    const p = packet.split(" ");
    if (p[1] == "1") {
        // player
        console.log(`On map you see player with name ${p[2]} id: ${p[4]}`);
        bot.useEmoji(NostaleEmoji.AltW);
    }
});
bot.login();
