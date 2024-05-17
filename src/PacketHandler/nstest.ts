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
    const sessionIdPosition = 76;
    const sessionId = parseInt(p[sessionIdPosition]);
    const channels = p.slice(sessionIdPosition + 1, -1);
    return {
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
}
