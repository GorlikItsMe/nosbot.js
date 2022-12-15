enum FailcError {
    ClientOutOfDate = 1,
    ConnectingError = 2,
    Maintenance = 3,
    AccountLoggedIn = 4,
    WrongPassword = 5,
    CantConnect = 6,
    Ban = 7,
    CountryBan = 8,
    WrongLetterCase = 9,
}

const strings = {
    1: "Your client is out of date. Please try again after the server maintenance or download the latest client from our website.",
    2: "An error occurred while connecting. Please try again.",
    3: "The server is currently undergoing maintenance. You can find the scheduled maintenance times on the NosTale website.",
    4: "This account name is currently in use.",
    5: "Your account name or password is incorrect. Too many incorrect attempts will lead to a temporary ban.",
    6: "This client cannot connect.",
    7: "Your account has been banned. Please contact the NosTale Team.",
    8: "Connecting to this server is not permitted from your country.",
    9: "Please check the upper and lowercase letters in your account name.",
};

export function failcToString(failcPacket: string): string {
    if (!failcPacket.startsWith("failc"))
        throw new Error("Wrong packet. Dont start with failc");

    const p = failcPacket.split(" ");
    const id = parseInt(p[1]);

    if (1 <= id && id <= 9) {
        // @ts-ignore: id is checked above
        return strings[id];
    }
    throw new Error("Unknown failc id");
}
