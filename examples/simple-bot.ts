/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as dotenv from "dotenv";
dotenv.config();

// import { NostaleBot, NostaleEmoji } from "@gorlikitsme/nosbot.js";
import { NostaleBot, NostaleEmoji } from "../src/index";
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
    game: {
        installationId: process.env.INSTALLATION_ID!,
        nostaleClientXVersion: "0.9.3.3087",
        nostaleClientXMd5Hash: "x",
        nostaleClientMd5Hash: "x",
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

/** Close bot when see alt+s emoji */
bot.on("eff", (packet) => {
    const p = packet.split(" ");
    if (p[1] == "1" && p[3] == "5083") {
        bot.close();
    }
});

/** Catch all recived packets */
// bot.on("packet_recv", (packet) => {
//     console.log("recv:", packet);
// });

bot.login().catch((err) => {
    console.log("bot crashed");
    console.error(err);
});
