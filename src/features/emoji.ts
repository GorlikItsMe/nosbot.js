// export type EmojiName = "AltQ" | "AltW";
export enum NostaleEmoji {
    AltQ = 973,
    AltW = 974,
    AltE = 975,
    AltR = 976,
    AltT = 977,
    AltY = 978,
    AltU = 979,
    AltI = 980,
    AltO = 981,
    AltP = 982,
    AltA = 983,
    AltS = 984,
    AltD = 985,
    AltF = 986,
    AltG = 987,
    AltH = 988,
    AltJ = 989,
    AltK = 990,
    AltL = 991,
    AltZ = 992,
    AltX = 993,
    AltC = 994,
    AltV = 995,
    AltB = 996,
    AltN = 997,
    AltM = 998,
    AltComma = 999,
    AltDash = 1000,
    Rainbow = 1000,
}

export function generateEmojiPacket(characterId: number, emojiId: NostaleEmoji): string {
    return `guri 10 1 ${characterId} ${emojiId}`;
}
