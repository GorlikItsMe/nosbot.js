export const ENCRYPTION_TABLE = [
    0x00, 0x20, 0x2d, 0x2e, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0xff,
    0x00,
];

export const DECRYPTION_TABLE = [
    0x00, 0x20, 0x2d, 0x2e, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x0a,
    0x00,
];

export function pack(packet: Buffer, charsToPack: number[]): Buffer {
    const output: number[] = [];
    const mask = GetMask(packet, charsToPack);
    let pos = 0;

    while (mask.length > pos) {
        let currentChunkLen = CalcLenOfMask(pos, mask, false);

        for (let i = 0; i < currentChunkLen; i++) {
            if (pos > mask.length) {
                break;
            }

            if (i % 0x7e == 0) {
                output.push(Math.min(currentChunkLen - i, 0xfe));
            }
            output.push(packet[pos] ^ 0xff);
            pos += 1;
        }

        currentChunkLen = CalcLenOfMask(pos, mask, true);
        for (let i = 0; i < currentChunkLen; i++) {
            if (pos > mask.length) {
                break;
            }

            if (i % 0x7e == 0) {
                output.push(Math.min(currentChunkLen - i, 0xfe) | 0x80);
            }

            const currentValue = charsToPack.indexOf(packet[pos]);
            if (i % 2 == 0) {
                output.push(currentValue << 4);
            } else {
                output[output.length - 1] |= currentValue;
            }
            pos += 1;
        }
    }

    output.push(0xff);
    return Buffer.from(output);
}

export function unpack(packet: Buffer, charsToUnpack: number[]): Buffer {
    const output: number[] = [];
    let pos = 0;

    while (packet.length > pos) {
        if (packet[pos] == 0xff) {
            break;
        }

        const currentChunkLen = packet[pos] & 0x7f;
        const isPacked = packet[pos] & 0x80;
        pos += 1;

        if (isPacked) {
            for (let i = 0; i < Math.ceil(currentChunkLen / 2); i++) {
                if (pos >= packet.length) {
                    break;
                }

                const twoChars = packet[pos];
                pos += 1;

                const leftChar = twoChars >> 4;
                output.push(charsToUnpack[leftChar]);

                const rightChar = twoChars & 0xf;
                if (rightChar == 0) {
                    break;
                }
                output.push(charsToUnpack[rightChar]);
            }
        } else {
            for (let i = 0; i < currentChunkLen; i++) {
                if (pos >= packet.length) {
                    break;
                }
                output.push(packet[pos] ^ 0xff);
                pos += 1;
            }
        }
    }
    return Buffer.from(output);
}

function GetMask(packet: Buffer, charset: number[]): boolean[] {
    const output: boolean[] = [];
    for (const i in packet) {
        if (Object.prototype.hasOwnProperty.call(packet, i)) {
            const ch = packet[i];

            if (ch == 0x0) {
                break;
            }
            output.push(GetMaskPart(ch, charset));
        }
    }
    return output;
}

function GetMaskPart(ch: number, charset: number[]): boolean {
    if (ch == 0) {
        return false;
    }
    return charset.includes(ch);
}

function CalcLenOfMask(start: number, mask: boolean[], value: boolean): number {
    let currentLen = 0;
    for (let i = start; i < mask.length; i++) {
        if (mask[i] == value) {
            currentLen += 1;
        } else {
            break;
        }
    }
    return currentLen;
}
