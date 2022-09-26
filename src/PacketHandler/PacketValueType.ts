class PacketValueBase {}

class Boolean extends PacketValueBase {}
class Number extends PacketValueBase {}
class String extends PacketValueBase {}

class Array<T> extends PacketValueBase {
    itemType: T;
    constructor(itemType: T) {
        super();
        this.itemType = itemType;
    }
}

export type PacketValueTypeList = PacketValueBase;

export default {
    PacketValueBase,

    Boolean,
    Number,
    String,
    Array,
};
