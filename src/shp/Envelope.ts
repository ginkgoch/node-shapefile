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

    disjoined(envelope: IEnvelope|undefined): boolean {
        if (envelope === undefined) return false;

        return this.maxx < envelope.minx || this.minx > envelope.maxx
            || this.miny > envelope.maxy || this.maxy < envelope.miny;
    }
}