import { md5, sha512 } from "./hash";
import { randomIntFromInterval } from "./rand";

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
    return `NoS0575 ${rand} ${login} ${passwordHash} ${installationId} 001399FB 0${c}${nostaleClientXVersion} 0 ${md5Hash}`;
}
