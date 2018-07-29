const _ = require('lodash');
const BufferReader = require('ginkgoch-buffer-reader');
const Envelope = require('./Envelope');

module.exports = class ShpReader extends BufferReader {
    nextEnvelope() {
        const minx = this.nextDoubleLE();
        const miny = this.nextDoubleLE();
        const maxx = this.nextDoubleLE();
        const maxy = this.nextDoubleLE();
        return new Envelope(minx, miny, maxx, maxy);
    }

    nextPoint() {
        const x = this.nextDoubleLE();
        const y = this.nextDoubleLE();
        return {
            x,
            y
        };
    }

    nextParts(numParts) {
        const parts = [];
        for (let i = 0; i < numParts; i++) {
            parts.push(this.nextInt32LE());
        }

        return parts;
    }

    nextPointsByParts(numPoints, parts) {
        const points = [];
        let currentPart = undefined;
        for (let i = 0; i < numPoints; i++) {
            if (_.includes(parts, i)) {
                currentPart = [];
                points.push(currentPart);
            }

            const p = this.nextPoint();
            currentPart.push(p);
        }

        return points;
    }
};