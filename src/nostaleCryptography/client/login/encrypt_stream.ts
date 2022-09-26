import { Transform, TransformCallback } from "stream";

export default class EncryptLoginStream extends Transform {
    constructor() {
        super({
            decodeStrings: false,
            encoding: undefined,
        });
    }

    _transform(packet: unknown, _: BufferEncoding, callback: TransformCallback): void {
        if (!Buffer.isBuffer(packet)) {
            callback(new TypeError("The first argument must be a login plain packet buffer."));
            return;
        }

        const { length } = packet;
        const encrypted = Buffer.allocUnsafe(length + 1);

        for (let i = 0; i < length; i++) {
            encrypted[i] = (packet[i] ^ 0xc3) + 0x0f;
        }
        encrypted[length] = 0xd8;

        callback(null, encrypted);
    }
}
