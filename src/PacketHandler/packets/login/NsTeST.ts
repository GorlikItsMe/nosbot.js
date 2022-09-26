import { PacketBase, PacketBaseConfig } from "../../PacketBase";
import PacketValueType from "../../PacketValueType";

export class ChannelInfoSubPacket extends PacketBase {
    ip!: string;
    port!: number;
    channelColor!: number;
    worldId!: string;
    channelId!: number;
    name!: string;

    static config: PacketBaseConfig = {
        empty: { id: 1 }, // usun to potem
    };

    constructor() {
        super();
        console.log(this.originalContent);
    }
}

export class NsTeST extends PacketBase {
    static header = "NsTeST";

    // Public fields
    unkn1!: number;
    login!: string;
    sessionId!: number;
    channels!: Array<string>;

    // Packet parser config
    static config: PacketBaseConfig = {
        // header: { id: 0 },
        unkn1: {
            id: 1,
            type: new PacketValueType.Number(),
        },
        login: { id: 2 },
        sessionId: { id: 75, type: Number },
        channels: {
            id: 76,
            type: new PacketValueType.Array<ChannelInfoSubPacket>(new ChannelInfoSubPacket()),
            // type: MyArray<string>(String),
            serializeToEnd: true,
        },
    };
}
