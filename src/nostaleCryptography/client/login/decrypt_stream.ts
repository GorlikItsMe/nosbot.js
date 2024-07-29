import { Transform, TransformCallback } from "stream";

function decrypt(packet: Buffer): Buffer {
    const length = packet.length - 1;
    const decrypted = Buffer.allocUnsafe(length);
    for (let i = 0; i < length; i++) {
        decrypted[i] = packet[i] - 0x0f;
    }
    return decrypted;
}

export default class DecryptLoginStream extends Transform {
    private state: {
        index: number;
        buffer: null | Buffer;
        length: number;
    };

    constructor() {
        super({
            decodeStrings: false,
            encoding: undefined,
        });
        this.state = {
            index: 0,
            buffer: null,
            length: 0,
        };
    }

    _transform(packet: Buffer, _: BufferEncoding, callback: TransformCallback): void {
        if (!Buffer.isBuffer(packet)) {
            callback(
                new TypeError("The first argument must be a login encrypted packet buffer.")
            );
            return;
        }

        // add part of old packet to the begining of packet
        if (this.state.buffer != null) {
            packet = Buffer.concat(
                [this.state.buffer, packet as Buffer],
                this.state.length + (packet as Buffer).length
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

            if (currentByte === 0x19) {
                currentEncryptedPacket.push(currentByte);
                // packet end, send what i have
                this.push(decrypt(Buffer.from(currentEncryptedPacket)));
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
