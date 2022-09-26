import { createLogger } from "../logger";
import { PacketBase, PacketBaseConfig, PacketBaseFieldConfig } from "./PacketBase";
import PacketValueType from "./PacketValueType";

const logger = createLogger("PacketFactory");

function GetSerializationInformation(
    packetType: typeof PacketBase | PacketBase
): PacketBaseConfig {
    return packetType.config ?? (packetType.constructor as PacketBase).config;
}

function SetValue(packetDefinition: PacketBase, fieldName: string, value: any) {
    packetDefinition[fieldName] = value;
}

function deserializeValue(
    fieldConfig: PacketBaseFieldConfig,
    currentValue: string
): string | number | boolean | null {
    if (fieldConfig.type instanceof PacketValueType.String || fieldConfig.type == String) {
        return currentValue;
    }

    if (fieldConfig.type instanceof PacketValueType.Number || fieldConfig.type == Number) {
        if (isNaN(parseInt(currentValue))) currentValue = "0";
        return parseInt(currentValue);
    }

    // check for empty value and cast it to null
    if (
        currentValue == "-1" ||
        currentValue == "-" ||
        currentValue == "NONE" ||
        currentValue == null
    )
        return null;

    // TODO enum should be casted to number

    // handle boolean values
    if (fieldConfig.type instanceof PacketValueType.Boolean || fieldConfig.type == Boolean) {
        return currentValue == "0" ? false : true;
    }

    // TODO: serializacja subpakietów
    if (fieldConfig.removeSeparator == true) {
        throw new Error("not implemented removeSeparator option");
    }

    // TODO: serializacja listy subpakietów
    if (fieldConfig.type instanceof PacketValueType.Array) {
        // todo jak się dowiedzieć jakiego typu elementy masz w tym arrayu?
        logger.warn(currentValue);
        logger.warn(fieldConfig.type.itemType);
        const sumpacketFieldConfig = GetSerializationInformation(fieldConfig.type.itemType);
        logger.warn(sumpacketFieldConfig);

        // return DeserializeSubpacketList(
        //     currentValue,
        //     fieldConfig.type.itemType,
        //     sumpacketFieldConfig
        // );
        throw new Error("not implemented Array type");
    }

    if (currentValue == null) {
        return null;
    }

    return currentValue;
}

function DeserializeSubpacketList(
    currentValues: string,
    packetBaseClass: PacketBase,
    serializationInformation: PacketBaseConfig
) {
    const sumPackets: any[] = [];
    currentValues.split(".").forEach((currentValue) => {
        // const v = new packetBaseClass.constructor();
        // skończyłem tutaj
        // DeserializeSubpacket w PacketFactroy.cs
        // sumPackets.push(v);
    });
}

function DeserializeSimpleList(
    currentValues: string,
    fieldConfig: PacketBaseFieldConfig
): any[] {
    const sumPackets: any[] = [];
    currentValues.split(".").forEach((currentValue) => {
        const v = deserializeValue(fieldConfig, currentValue);
        sumPackets.push(v);
    });
    return sumPackets;
}

export class PacketFactory {
    public static deserialize(
        packetContent: string,
        packetType: typeof PacketBase
    ): PacketBase {
        try {
            const serializationInformation = GetSerializationInformation(packetType);
            const deserializedPacket = new packetType();
            deserializedPacket.OriginalContent = packetContent;

            const p = packetContent.trim().split(" ");

            for (const fieldName in serializationInformation) {
                if (
                    Object.prototype.hasOwnProperty.call(serializationInformation, fieldName)
                ) {
                    const fieldConfig = serializationInformation[fieldName];
                    if (fieldConfig.serializeToEnd == true) {
                        // get the value to the end and stop deserialization
                        const valueToEnd = p.slice(fieldConfig.id).join(" ");
                        SetValue(
                            deserializedPacket,
                            fieldName,
                            deserializeValue(fieldConfig, valueToEnd)
                        );
                        break;
                    }
                    const currentValue = p[fieldConfig.id];
                    SetValue(
                        deserializedPacket,
                        fieldName,
                        deserializeValue(fieldConfig, currentValue)
                    );
                }
            }
            return deserializedPacket;
        } catch (error) {
            logger.error(error);
            logger.error(
                `The serialized packet has the wrong format. Packet: ${packetContent}`
            );
            throw error;
        }
    }
}
