import IEnvelope from "./IEnvelope";
import GeomParser from "./parser/GeomParser";

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

    static union(env1: IEnvelope, env2: IEnvelope): IEnvelope {
        let minx = Math.min(env1.minx, env2.minx);
        let miny = Math.min(env1.miny, env2.miny);
        let maxx = Math.max(env1.maxx, env2.maxx);
        let maxy = Math.max(env1.maxy, env2.maxy);
        return { minx, miny, maxx, maxy };
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

    static from(geometry: any) {
        const coordinates = GeomParser.vertices(geometry);
        let [minx, miny, maxx, maxy] = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE];
        for(let coordinate of coordinates) {
            if (minx > coordinate[0]) minx = coordinate[0];
            if (miny > coordinate[1]) miny = coordinate[1];
            if (maxx < coordinate[0]) maxx = coordinate[0];
            if (maxy < coordinate[1]) maxy = coordinate[1];
        }

        return new Envelope(minx, miny, maxx, maxy);
    }
}