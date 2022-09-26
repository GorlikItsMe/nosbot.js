import { PacketValueTypeList } from "./PacketValueType";

export interface PacketBaseFieldConfig {
    // The zero based index starting from header
    id: number;

    // variable type
    // type?: typeof String | typeof Number | typeof Boolean | typeof Array<any>;
    type?: PacketValueTypeList;

    // Adds an # to the Header and replaces Spaces with ^ if set to true.
    isReturnPacket?: boolean;

    // Defines if everything from this index should be serialized into the underlying property
    serializeToEnd?: boolean;

    //  Removes the separator (.) for List<PacketDefinition> packets.
    removeSeparator?: boolean;
}

export interface PacketBaseConfig {
    [key: string]: PacketBaseFieldConfig;
}

export class PacketBase {
    // packet prefix (or name)
    static header = "";

    // Packet parser config
    static config: PacketBaseConfig = {
        header: { id: 0 },
    };

    // Debug
    originalContent?: string; // original packet content

    [key: string]: any; // for all custom names
}
