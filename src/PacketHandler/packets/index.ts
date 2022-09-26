import { PacketBase } from "../PacketBase";
import { NsTeST } from "./login/NsTeST";

export const packetsList: typeof PacketBase[] = [NsTeST];

const _packetsDict: { [key: string]: typeof PacketBase } = {};
packetsList.forEach((p) => {
    _packetsDict[p.header] = p;
});

export const packetsDict = _packetsDict;
