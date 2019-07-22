import IEnvelope from "./IEnvelope";

export default class Envelope implements IEnvelope {
    minx: number;
    miny: number;
    maxx: number;
    maxy: number;

    constructor(minx: number, miny: number, maxx: number, maxy: number) {
        this.minx = minx;
        this.miny = miny;
        this.maxx = maxx;
        this.maxy = maxy;
    }

    static disjoined(envelope1: IEnvelope|undefined, envelope2: IEnvelope|undefined): boolean {
        if (envelope1 === undefined || envelope2 === undefined) return false;

        return envelope1.maxx < envelope2.minx || envelope1.minx > envelope2.maxx
            || envelope1.miny > envelope2.maxy || envelope1.maxy < envelope2.miny;
    }

    static equals(envelope1: IEnvelope|undefined, envelope2: IEnvelope|undefined, tolerance: number = 0) {
        if (envelope1 === undefined && envelope2 === undefined) {
            return true;
        }

        if (envelope1 === undefined || envelope2 === undefined) {
            return false;
        }

        return Math.abs(envelope1.minx - envelope2.minx) <= tolerance &&
            Math.abs(envelope1.miny - envelope2.miny) <= tolerance &&
            Math.abs(envelope1.maxx - envelope2.maxx) <= tolerance &&
            Math.abs(envelope1.maxy - envelope2.maxy) <= tolerance;
    }
}