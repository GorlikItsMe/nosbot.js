export interface PacketNsTeST {
    name: string;
    sessionId: number;
    channels: PacketNsTeST_Channel[];
}

export interface PacketNsTeST_Channel {
    ip: string;
    port: number;
    color: number;
    worldId: number;
    channelId: number;
    name: string;
}

export function parseNsTestPacket(packet: string): PacketNsTeST {
    packet = packet.replace("  ", " "); // Fix NsTest packet where is double space

    const p = packet.split(" ");
    const name = p[2];

    // dynamic finding sessionId position
    // find first part where is ip (contains ':')
    const ipPosition = p.findIndex((a) => a.includes(":"));
    if (ipPosition == -1) {
        throw new Error("No ip found (probably invalid NsTest packet)");
    }
    const sessionIdPosition = ipPosition - 1;
    // const sessionIdPosition = 124;
    const sessionId = parseInt(p[sessionIdPosition]);

    const channels = p.slice(sessionIdPosition + 1, -1);
    const out = {
        name: name,
        sessionId: sessionId,
        channels: channels.map((a) => {
            const [ip, port, color, data] = a.split(":");
            const [worldId, channelId, name] = data.split(".", 3);
            return {
                ip: ip,
                port: parseInt(port),
                color: parseInt(color),
                worldId: parseInt(worldId),
                channelId: parseInt(channelId),
                name: name,
            };
        }),
    };
    if (typeof out.sessionId !== "number" || isNaN(out.sessionId)) {
        throw new Error("No sessionId found (probably invalid NsTest packet)");
    }
    if (out.channels.length == 0) {
        throw new Error("No channels found");
    }
    return out;
}
