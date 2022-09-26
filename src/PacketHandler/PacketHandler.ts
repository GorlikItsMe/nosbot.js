import EventEmitter from "events";
import { createLogger } from "../logger";
// import { packetsDict } from "./packets";

const logger = createLogger("PacketHandler");

export class PacketHandler extends EventEmitter {
    constructor() {
        super();

        this.on("packet_send", (packet) => {
            logger.debug("send: %s", packet);
        });
        this.on("packet_recv", (packet) => this._recvPacket(packet));
    }

    on(eventName: string, listener: (...args: any[]) => void): this {
        return super.on(eventName, listener);
    }

    async waitForPacket(packetHeader: string): Promise<string> {
        return new Promise((resolve) => {
            this.once(packetHeader, (packetRaw) => resolve(packetRaw));
        });
    }

    async waitForFirstPacket(): Promise<string> {
        return new Promise((resolve) => {
            this.once("packet_recv", (packetRaw) => {
                resolve(packetRaw);
            });
        });
    }

    private _recvPacket(packetRaw: string) {
        logger.debug("recv: %s", packetRaw);
        const header = packetRaw.split(" ", 1)[0];

        this.emit(header, packetRaw);
    }
}
