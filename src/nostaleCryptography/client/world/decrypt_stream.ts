import { Transform, TransformCallback } from "stream";
import { DECRYPTION_TABLE, unpack } from "./utils";

export default class DecryptWorldStream extends Transform {
    private notParsedBuffer: Buffer | null = null;

    constructor() {
        super({ decodeStrings: false, encoding: undefined });
    }

    _transform(packet: Buffer, _: BufferEncoding, callback: TransformCallback): void {
        if (!Buffer.isBuffer(packet)) {
            callback(
                new TypeError("The first argument must be a world encrypted packet's buffer.")
            );
            return;
        }
        if (packet.length === 0) {
            console.log("empty packet? wtf?");
            callback(null);
            return;
        }

        // add part of old packet to the begining of packet
        if (this.notParsedBuffer != null) {
            const combinedPacket = Buffer.concat([this.notParsedBuffer, packet]);
            this.notParsedBuffer = null;
            packet = combinedPacket;
        }

        const len = packet.length;
        let currentDecryptedPacket: number[] = [];
        let index = 0;
        let currentByte = 0;
        const fullyDecryptedPackets: Buffer[] = [];

        while (index < len) {
            currentByte = packet[index++];
            currentDecryptedPacket.push(currentByte);

            if (currentByte === 0xff) {
                // packet end, send what i have
                fullyDecryptedPackets.push(
                    unpack(Buffer.from(currentDecryptedPacket), DECRYPTION_TABLE)
                );
                currentDecryptedPacket = [];
                continue;
            }
        }

        // save not fully recived packet for future
        if (currentDecryptedPacket.length > 0) {
            this.notParsedBuffer = Buffer.from(currentDecryptedPacket);
        }

        for (const decryptedPacket of fullyDecryptedPackets) {
            this.push(decryptedPacket); // push decrypted packet to next stream
        }
        callback(null);
    }
}
