import EventEmitter from "events";
import { generateEmojiPacket, NostaleEmoji } from "./features/emoji";
import { createLogger } from "./logger";
import { pickWorldServer, selectCharacter, sendLoginPacket } from "./modules/login";
import { parseNsTestPacket } from "./PacketHandler/nstest";
import { TcpClientManager } from "./TcpClient/TcpClientManager";
import { failcToString } from "./utils/failcToString";
import { sleep } from "./utils/sleep";
import { createWalkPacketsChain, getDistanceGridNostale } from "./modules/walk";

const logger = createLogger("NostaleBot");

interface nosbotConfig {
    auth:
        | {
              type: "priv";
              login: string;
              password: string;
          }
        | {
              type: "NoS0577_with_token";
              token: string;
              login: string;
              languageId?: number;
          }
        | {
              type: "custom";
              customLoginPacket: string;
              login: string;
              password: string;
          };
    loginServer: {
        ip: string;
        port: number;
    };
    worldServer:
        | {
              byServerName?: string;
              channelId: number;
          }
        | {
              ip: string;
              port: number;
          };
    selectCharacter?:
        | {
              byId: number;
          }
        | {
              byName: string;
          };
    extra?: {
        nosvoidPin?: string;
    };
    game: {
        installationId: "00000000-0000-0000-0000-000000000000" | string;
        nostaleClientXVersion: "0.9.3.3087" | string;
        nostaleClientXMd5Hash: string;
        nostaleClientMd5Hash: string;
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
    pulseInterval?: NodeJS.Timeout;

    currentStage: BotStage = "auth";
    characterList: Character[] = [];
    currentCharacter = {
        name: "",
        id: 0,
        mapId: -1,
        x: -1,
        y: -1,
        speed: 16,
    };

    _sendMiddleware = (packet: string): string => packet;

    constructor(nosbotConfig: nosbotConfig) {
        super();
        this.config = nosbotConfig;
        this.tcpClient = new TcpClientManager();
    }

    // Main method to start bot
    public async login(): Promise<void> {
        this.currentStage = "auth";

        // connect to login server
        const loginServer = this.config.loginServer;

        logger.info(`Connecting to LoginServer...`);
        await this.tcpClient.connect(loginServer.ip, loginServer.port);
        logger.info(`Connected!`);

        // send login packet
        sendLoginPacket(this);

        // wait for response, and handle that response
        const nstestPacket = await this.tcpClient.packetHandler.waitForFirstPacket();

        if (nstestPacket.startsWith("failc")) {
            this.tcpClient.destroy(); // close
            logger.debug(`${nstestPacket}`); // error failc
            logger.error(failcToString(nstestPacket));
            return;
        }
        this.tcpClient.destroy(); // close

        // deserialize NsTeST
        const nstest = parseNsTestPacket(nstestPacket);
        const sessionId = nstest.sessionId;
        logger.debug(`login: ${nstest.name}; sessionId: ${sessionId}`);
        await sleep(1000);

        // connect to world server
        logger.debug("============= WORLD =============");
        this.tcpClient = new TcpClientManager(sessionId);
        const [channelIp, channelPort] = pickWorldServer(this, nstest);
        await this.tcpClient.connect(channelIp, channelPort);
        logger.info(`Connected!`);

        // Authorize to world
        this.tcpClient.sendPacket(`${sessionId}`);
        await sleep(500);
        if (this.config.auth.type == "NoS0577_with_token") {
            const langId = this.config.auth.languageId || 0;
            this.tcpClient.sendPacket(`${this.config.auth.login} GF ${langId}`);
            this.tcpClient.sendPacket(`thisisgfmode`);
        } else {
            this.tcpClient.sendPacket(`${this.config.auth.login} ORG 0`);
            this.tcpClient.sendPacket(`${this.config.auth.password}`);
        }

        // Create packet Handler and publish it
        this.tcpClient.packetHandler.on("packet_recv", (packetraw: string) => {
            const p = packetraw.split(" ", 1);
            this.emit("packet_recv", packetraw);
            this.emit(p[0], packetraw);
            this.internalPacketHandle(packetraw);
        });
        this.startPulseThread();

        // select character
        logger.debug("============= Character Select =============");
        await this.tcpClient.packetHandler.waitForPacket("clist_end");
        this.sendPacket(`select ${selectCharacter(this)}`);

        // wait for OK and start everything
        this.tcpClient.packetHandler.waitForPacket("OK").then(() => {
            logger.info("* Welcome You are now in game *");
            this.sendPacket("game_start");
            this.sendPacket("lbs 0");
            this.sendPacket("c_close 1");
            this.sendPacket("npinfo 0");
        });
    }

    public setSendMiddleware(fn: (packet: string) => string): void {
        this._sendMiddleware = fn;
    }

    public sendPacket(packet: string): void {
        return this.tcpClient.sendPacket(this._sendMiddleware(packet));
    }

    public useEmoji(emojiId: NostaleEmoji): void {
        this.sendPacket(generateEmojiPacket(this.currentCharacter.id, emojiId));
    }

    public close(): void {
        this.tcpClient.destroy();
        this.stopPulseThread();
    }

    public async walkTo(x: number, y: number): Promise<void> {
        /**
         * Warning: You will go straight like trough walls, trees, etc.
         * If you want to walk on the map, you need to implement some kind of pathfinding.
         * This function is useful if you want to go to near NPC or correct your position efter relog.
         */
        if (this.currentCharacter.x == x && this.currentCharacter.y == y) {
            return; // already there
        }
        while (this.currentCharacter.x == -1 || this.currentCharacter.y == -1) {
            await sleep(100); // wait for position
        }

        // create chain of walk packets
        const packets = createWalkPacketsChain(
            {
                x: this.currentCharacter.x,
                y: this.currentCharacter.y,
            },
            {
                x: x,
                y: y,
            },
            this.currentCharacter.speed
        );
        let distanceLeft = 0;
        for (const packet of packets) {
            this.sendPacket(packet);
            const distance =
                getDistanceGridNostale(
                    this.currentCharacter.x,
                    this.currentCharacter.y,
                    x,
                    y
                ) + distanceLeft;
            const fixedDistance = Math.round(distance);
            distanceLeft = distance - fixedDistance;
            const speedFactor = 1000 * (fixedDistance / (0.4 * this.currentCharacter.speed));
            await sleep(speedFactor);
        }
    }

    // obsługa pakietów przez bota
    // obsługa wewnętrzenej logiki, kim ja jestem, gdzie jestem, co widze itd żeby móc łatwo później odczytywać to używając api bota
    private internalPacketHandle(packet: string) {
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
            this.currentCharacter.id = parseInt(p[6]);
            this.currentCharacter.name = p[1];
        }
        if (packet.startsWith("cond")) {
            const p = packet.split(" ");
            if (p[2] == this.currentCharacter.id.toString()) {
                this.currentCharacter.speed = parseInt(p[5]);
            }
        }
        if (packet.startsWith("at")) {
            const p = packet.split(" ");

            if (p[1] == this.currentCharacter.id.toString()) {
                this.currentCharacter.mapId = parseInt(p[2]);
                this.currentCharacter.x = parseInt(p[3]);
                this.currentCharacter.y = parseInt(p[4]);
            }
        }
    }

    private startPulseThread() {
        let pulseSek = 60;
        this.pulseInterval = setInterval(() => {
            this.sendPacket(`pulse ${pulseSek}`);
            pulseSek += 60;
        }, 60000);
    }
    private stopPulseThread() {
        clearInterval(this.pulseInterval);
    }
}
