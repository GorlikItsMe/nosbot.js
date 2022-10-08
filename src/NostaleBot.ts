import EventEmitter from "events";
import { generateEmojiPacket, NostaleEmoji } from "./features/emoji";
import { createLogger } from "./logger";
import { TcpClientManager } from "./TcpClient/TcpClientManager";
import { sleep } from "./utils/sleep";

const logger = createLogger("Core");

interface nosbotConfig {
    auth: {
        type: "priv";
        login: string;
        password: string;
    };
    installationId: string;
    loginServer: {
        ip: string;
        port: number;
    };
    worldServer: {
        ip: string;
        port: number;
    };
    selectCharacter?: {
        byId?: number;
        byName?: string;
    };
    extra?: {
        nosvoidPin?: string;
    };
}

type BotStage = "auth" | "character_select";
interface Character {
    id: number;
    name: string;
}

export class NostaleBot extends EventEmitter {
    config: nosbotConfig;
    tcpClient: TcpClientManager;
    pulseInterval?: NodeJS.Timer;

    currentStage: BotStage = "auth";
    characterList: Character[] = [];
    currentCharacter = {
        name: "",
        id: 0,
    };

    constructor(nosbotConfig: nosbotConfig) {
        super();
        this.config = nosbotConfig;
        this.tcpClient = new TcpClientManager();
    }

    // Main method to start bot
    public async login(): Promise<void> {
        this.currentStage = "auth";
        if (this.config.auth.type == "priv") {
            const loginServer = this.config.loginServer;
            const worldServer = this.config.worldServer;

            logger.info(`Connecting to LoginServer...`);
            await this.tcpClient.connect(loginServer.ip, loginServer.port);
            logger.info(`Connected!`);

            this.tcpClient.sendLoginPacket(
                this.config.auth.login,
                this.config.auth.password,
                this.config.installationId
            );
            const nstestPacket = await this.tcpClient.packetHandler.waitForFirstPacket();

            if (nstestPacket.startsWith("failc")) {
                this.tcpClient.destroy(); // close
                logger.error(`${nstestPacket}`); // error failc
                return;
            }
            this.tcpClient.destroy(); // close

            // deserialize NsTeST
            const p = nstestPacket.split(" ");
            const login = p[2];
            const sessionId = parseInt(p[75]);

            logger.debug(`login: ${login}; sessionId: ${sessionId}`);
            await sleep(1000);

            // connect to world server
            logger.debug("============= WORLD =============");
            this.tcpClient = new TcpClientManager(sessionId);
            logger.info(`Connecting to WorldServer...`);
            await this.tcpClient.connect(worldServer.ip, worldServer.port);
            logger.info(`Connected!`);

            this.tcpClient.sendPacket(`${sessionId}`);
            await sleep(500);
            this.tcpClient.sendPacket(`${this.config.auth.login} ORG 0`);
            this.tcpClient.sendPacket(`${this.config.auth.password}`);

            // Create packet Handler and publish it
            await this.tcpClient.packetHandler.on("packet_recv", (packetraw: string) => {
                const p = packetraw.split(" ");
                this.emit("packet_recv", packetraw);
                this.emit(p[0], packetraw);
                this.buildInPacketHandle(packetraw);
            });
            this.startPulseThread();

            logger.debug("============= Character Select =============");
            await this.tcpClient.packetHandler.waitForPacket("clist_end");

            const charById = this.characterList.find(
                (a) => a.id === this.config.selectCharacter?.byId
            );
            const charByName = this.characterList.find(
                (a) =>
                    a.name.toLowerCase() ===
                    (this.config.selectCharacter?.byName ?? "").toLowerCase()
            );
            if (charById) {
                this.sendPacket(`select ${charById.id}`);
            } else if (charByName) {
                this.sendPacket(`select ${charByName.id}`);
            } else {
                logger.warn(
                    "You have not selected a character to log. I will choose the first one"
                );
                this.sendPacket(`select ${this.characterList[0].id}`);
            }

            // wait for OK and start everything
            this.tcpClient.packetHandler.waitForPacket("OK").then(() => {
                logger.info("* Welcome You are now in game *");
                this.sendPacket("game_start");
                this.sendPacket("lbs 0");
                this.sendPacket("c_close 1");
                this.sendPacket("npinfo 0");
            });
        }
    }

    public sendPacket(packet: string): void {
        return this.tcpClient.sendPacket(packet);
    }

    public useEmoji(emojiId: NostaleEmoji): void {
        this.sendPacket(generateEmojiPacket(this.currentCharacter.id, emojiId));
    }

    public close(): void {
        this.tcpClient.destroy();
        clearInterval(this.pulseInterval);
    }

    // obsługa pakietów przez bota
    // obsługa wewnętrzenej logiki, kim ja jestem, gdzie jestem, co widze itd żeby móc łatwo później odczytywać to używając api bota
    private buildInPacketHandle(packet: string) {
        /* #region Character select screan */
        if (this.currentStage == "auth" && packet == "clist_start 0") {
            this.currentStage = "character_select";
            this.characterList = [];
        }
        if (packet.startsWith("clist ")) {
            const p = packet.split(" ");
            this.characterList.push({ id: parseInt(p[1]), name: p[2] });
        }
        /* #endregion */

        // nosvoid check pin
        if (this.config.extra?.nosvoidPin) {
            if (packet == "guri 10 4 0 1") {
                this.sendPacket(`guri 4 4 0 0 ${this.config.extra.nosvoidPin}`);
            }
        }

        //
        if (packet.startsWith("c_info ")) {
            // c_info Killrog - -1 1.918 FamilyName 14187 2 0 0 2 3 14 500 0 0 20 0 0 0 0
            const p = packet.split(" ");
            this.currentCharacter = {
                name: p[1],
                id: parseInt(p[6]),
            };
        }
    }

    private startPulseThread() {
        let pulseSek = 60;
        this.pulseInterval = setInterval(() => {
            this.sendPacket(`pulse ${pulseSek}`);
            pulseSek += 60;
        }, 60000);
    }
}
