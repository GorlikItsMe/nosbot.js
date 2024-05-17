import { md5, sha512 } from "./hash";
import { randomIntFromInterval } from "./rand";

function randomString(length: number, chars: string) {
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/** NoS0575 */
export function createLoginPacketPrivServer(
    login: string,
    password: string,
    installationId: string,
    nostaleClientXHash: string,
    nostaleClientHash: string,
    nostaleClientXVersion: string
): string {
    const md5Hash = md5(nostaleClientXHash.toUpperCase() + nostaleClientHash.toUpperCase());
    const passwordHash = sha512(password);
    const rand = randomIntFromInterval(2222222, 8888888);
    const c = String.fromCharCode(0xb);
    const rand2 = randomString(8, "1234567890ABCDEF");
    return `NoS0575 ${rand} ${login} ${passwordHash} ${installationId} ${rand2} 0${c}${nostaleClientXVersion} 0 ${md5Hash}`;
}

/** NoS0577 */
export function createLoginPacketNos0577(
    token: string,
    installationId: string,
    nostaleClientXHash: string,
    nostaleClientHash: string,
    nostaleClientXVersion: string
): string {
    const md5Hash = md5(nostaleClientXHash.toUpperCase() + nostaleClientHash.toUpperCase());
    const rand2 = randomString(8, "1234567890ABCDEF");
    const c = String.fromCharCode(0xb);
    return `NoS0577 ${token}  ${installationId} ${rand2} 0${c}${nostaleClientXVersion} 0 ${md5Hash}`;
}
