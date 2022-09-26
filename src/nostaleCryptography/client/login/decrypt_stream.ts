import { Transform, TransformCallback } from "stream";

export default class DecryptLoginStream extends Transform {
    constructor() {
        super({
            decodeStrings: false,
            encoding: undefined,
        });
    }

    _transform(packet: unknown, _: BufferEncoding, callback: TransformCallback): void {
        if (!Buffer.isBuffer(packet)) {
            callback(
                new TypeError("The first argument must be a login encrypted packet buffer.")
            );
            return;
        }

        const length = packet.length - 1;
        const decrypted = Buffer.allocUnsafe(length);

        for (let i = 0; i < length; i++) {
            decrypted[i] = packet[i] - 0x0f;
        }

        callback(null, decrypted);
    }
}
