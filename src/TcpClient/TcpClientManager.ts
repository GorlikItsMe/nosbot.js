import Net from "node:net";
import { PromiseSocket } from "promise-socket";
import nosCrypto from "../nostaleCryptography";
import { encodeStream, decodeStream } from "iconv-lite";
import { pipeline } from "node:stream";
import EncryptLoginStream from "../nostaleCryptography/client/login/encrypt_stream";
import DecryptLoginStream from "../nostaleCryptography/client/login/decrypt_stream";
import { createLogger } from "../logger";
import { PacketHandler } from "../PacketHandler/PacketHandler";
import DecryptWorldStream from "../nostaleCryptography/client/world/decrypt_stream";

const logger = createLogger("TcpClientManager");

// NostaleClientManager
export class TcpClientManager {
    public packetHandler = new PacketHandler();

    public socket: Net.Socket;
    private client: PromiseSocket<Net.Socket>;
    private _pipeline: NodeJS.ReadWriteStream | undefined;
    private encryptStream: EncryptLoginStream;
    private decryptStream: DecryptLoginStream | DecryptWorldStream;
    private encodingStream: NodeJS.ReadWriteStream;
    private decodingStream: NodeJS.ReadWriteStream;

    constructor(sessionId?: number, onClose?: () => void) {
        this.socket = new Net.Socket();
        this.client = new PromiseSocket(this.socket);

        this.encryptStream = nosCrypto.createCipher(sessionId);
        this.decryptStream = nosCrypto.createDecipher(sessionId);
        this.encodingStream = encodeStream("win1252");
        this.decodingStream = decodeStream("win1252");

        this.client.socket.on("close", () => {
            logger.debug("socket closed");
            if (onClose) {
                onClose();
            }
        });
    }

    public connect(host: string, port: number): Promise<void> {
        logger.debug(`Connecting to ${host}:${port}...`);
        return this.client.connect(port, host).then(() => {
            this._pipeline = pipeline(
                this.encodingStream,
                this.encryptStream,
                this.socket,
                this.decryptStream,
                this.decodingStream,
                (err) => {
                    if (err) {
                        logger.error("Pipeline failed.");
                        logger.debug(err);
                    } else {
                        logger.info("Pipeline succeeded.");
                    }
                    this.destroy();
                    logger.info("Game closed because stream pipeline closed.");
                }
            );

            // this.packetHandler.on("packet_send", (packet) => {
            //     this.encodingStream.write(packet);
            // });
            this.decodingStream.on("data", (packet: string) => {
                this.packetHandler.emit("packet_recv", packet.trimEnd());
            });
        });
    }

    // close connection
    public destroy(): void {
        if (this._pipeline?.isPaused()) {
            return;
        }
        this._pipeline?.pause();
        this._pipeline?.end(() => {
            this.client.end();
        });
        logger.debug(`TCP Connection closed`);
    }

    // Packets

    public sendPacket(data: string): void {
        this.encodingStream.write(data);
        // this.packetHandler.emit("packet_send", data);
    }
}
