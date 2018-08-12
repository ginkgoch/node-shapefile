module.exports = class Envelope {
    constructor(minx, miny, maxx, maxy) {
        this.minx = minx;
        this.miny = miny;
        this.maxx = maxx;
        this.maxy = maxy;
    }

    disjoined(envelope) {
        if (envelope === undefined) return false;

        return this.maxx < envelope.minx || this.minx > envelope.maxx
            || this.miny > envelope.maxy || this.maxy < envelope.miny;
    }
}