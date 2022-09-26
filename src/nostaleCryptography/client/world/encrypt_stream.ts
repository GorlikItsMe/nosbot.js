import { Transform, TransformCallback } from "stream";
import { ENCRYPTION_TABLE, pack } from "./utils";

export default class EncryptWorldStream extends Transform {
    session: number;
    isFirstPacket = true;
    packetId = 1;
    constructor(session: number) {
        super({ decodeStrings: false, encoding: undefined });

        if (!Number.isFinite(session)) {
            throw new TypeError(
                "The first argument of the constructor must be a valid session number."
            );
        }

        this.session = session;
        this.isFirstPacket = true;
    }

    _transform(packet: Buffer, _: BufferEncoding, callback: TransformCallback): void {
        if (!Buffer.isBuffer(packet)) {
            callback(
                new TypeError("The first argument must be a world plain packet's buffer.")
            );
            return;
        }
        const isSessionPacket = this.isFirstPacket;
        this.isFirstPacket = false;

        // packet counting
        this.packetId += 1;
        packet = Buffer.from(`${this.packetId} ${packet}`);

        packet = pack(packet, ENCRYPTION_TABLE);

        let sessionNumber = (this.session >> 6) & 3;
        if (isSessionPacket) {
            sessionNumber = -1;
        }
        const sessionKey = this.session & 0xff;

        switch (sessionNumber) {
            case 0:
                for (let i = 0, l = packet.length; i < l; i++) {
                    packet[i] = (packet[i] + sessionKey + 0x40) & 0xff;
                }
                break;
            case 1:
                for (let i = 0, l = packet.length; i < l; i++) {
                    packet[i] = (packet[i] - sessionKey - 0x40) & 0xff;
                }
                break;
            case 2:
                for (let i = 0, l = packet.length; i < l; i++) {
                    packet[i] = ((packet[i] ^ 0xc3) + sessionKey + 0x40) & 0xff;
                }
                break;
            case 3:
                for (let i = 0, l = packet.length; i < l; i++) {
                    packet[i] = ((packet[i] ^ 0xc3) - sessionKey - 0x40) & 0xff;
                }
                break;
            default:
                for (let i = 0, l = packet.length; i < l; i++) {
                    packet[i] = (packet[i] + 0x0f) & 0xff;
                }
                break;
        }

        callback(null, packet);
    }
}
