function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function createWalkPacketsChain(
    start: { x: number; y: number },
    target: { x: number; y: number },
    speed: number
): string[] {
    const packets: string[] = [];
    let bestDistance = 100000;
    let bestPos = { x: 0, y: 0 };
    let pos = { x: start.x, y: start.y };

    while (bestDistance > 0) {
        for (let q = -3; q <= 3; q++) {
            for (let p = -3; p <= 3; p++) {
                const _t = distance({ x: pos.x + p, y: pos.y + q }, target);
                if (_t < bestDistance) {
                    bestDistance = _t;
                    bestPos = { x: pos.x + p, y: pos.y + q };
                }
            }
        }

        // create packet
        const w = ((bestPos.x + bestPos.y) % 3) % 2;
        const packet = `walk ${bestPos.x} ${bestPos.y} ${w} ${speed}`;
        packets.push(packet);
        pos = bestPos;
    }
    return packets;
}

export function getDistanceGridNostale(
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number {
    const x = Math.abs(x1 - x2);
    const y = Math.abs(y1 - y2);
    if (x == y) {
        return Math.sqrt(Math.pow(x, 2) * 2);
    }
    return Math.abs(x - y) + Math.sqrt(Math.pow(Math.min(x, y), 2) * 2);
}
