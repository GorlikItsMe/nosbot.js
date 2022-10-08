import { Transform, TransformCallback } from "stream";
import { DECRYPTION_TABLE, unpack } from "./utils";

export default class DecryptWorldStream extends Transform {
    state: {
        index: number;
        buffer: null | Buffer;
        length: number;
    };
    constructor() {
        super({ decodeStrings: false, encoding: undefined });
        this.state = {
            index: 0,
            buffer: null,
            length: 0,
        };
    }

    _transform(packet: Buffer, _: BufferEncoding, callback: TransformCallback): void {
        if (!Buffer.isBuffer(packet)) {
            callback(
                new TypeError("The first argument must be a world encrypted packet's buffer.")
            );
            return;
        }

        // add part of old packet to the begining of packet
        if (this.state.buffer != null) {
            packet = Buffer.concat(
                [this.state.buffer, packet],
                this.state.length + packet.length
            );
            this.state.index = 0;
            this.state.buffer = null;
            this.state.length = 0;
        }

        const len = packet.length;
        let currentEncryptedPacket: number[] = [];
        let index = 0;
        let currentByte = 0;

        while (index < len) {
            currentByte = packet[index++];

            if (currentByte === 0xff) {
                // packet end, send what i have
                this.push(unpack(Buffer.from(currentEncryptedPacket), DECRYPTION_TABLE));
                currentEncryptedPacket = [];
                this.state.index = index;
                continue;
            }
            currentEncryptedPacket.push(currentByte);
        }

        // save not fully recived packet for future
        if (index > this.state.index) {
            const temp = packet.slice(this.state.index);
            this.state.buffer = temp;
            this.state.length = temp.length;
        }
        callback();
    }
}
