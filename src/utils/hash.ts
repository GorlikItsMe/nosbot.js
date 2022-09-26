import { BinaryLike, createHash } from "node:crypto";

export function md5(data: BinaryLike): string {
    return createHash("md5").update(data).digest("hex").toUpperCase();
}

export function sha512(data: BinaryLike): string {
    return createHash("sha512").update(data).digest("hex").toUpperCase();
}
