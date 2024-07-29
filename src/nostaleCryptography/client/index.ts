import EncryptLoginStream from "./login/encrypt_stream";
import DecryptLoginStream from "./login/decrypt_stream";

import EncryptWorldStream from "./world/encrypt_stream";
import DecryptWorldStream from "./world/decrypt_stream";

export function createCipher(session?: number): EncryptLoginStream {
    if (session == null) {
        return new EncryptLoginStream();
    } else if (Number.isFinite(session)) {
        return new EncryptWorldStream(session);
    }

    throw new TypeError(
        "The first agument must be null/undefined in order to get the Login Cipher or a session number in order to get the World Cipher."
    );
}

export function createDecipher(session?: number): DecryptLoginStream | DecryptWorldStream {
    if (session == null) {
        return new DecryptLoginStream();
    } else if (Number.isFinite(session)) {
        return new DecryptWorldStream();
    }

    throw new TypeError(
        "The first argument must be null/undefined in order to get the Login Decipher or a session number in order to get the World Decipher."
    );
}
