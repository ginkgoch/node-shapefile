const _ = require('lodash');

module.exports = {
    readEnvelope: function(buffer, offset = 0) {
        const minx = buffer.readDoubleLE(offset);
        const miny = buffer.readDoubleLE(offset + 8);
        const maxx = buffer.readDoubleLE(offset + 16);
        const maxy = buffer.readDoubleLE(offset + 24);
        return { minx, miny, maxx, maxy };
    },

    readPoint: function(buffer, offset = 0) {
        const x = buffer.readDoubleLE(offset);
        const y = buffer.readDoubleLE(offset + 8);
        return { x, y };
    },

    readParts: function(buffer, numParts, offset = 0) {
        const parts = [];
        for (let i = 0; i < numParts; i++) {
            parts.push(buffer.readInt32LE(offset + i * 4));
        }

        return parts;
    },

    readPointsByParts: function(buffer, numPoints, offset, parts) {
        const points = [];
        let currentPart = undefined;
        for (let i = 0; i < numPoints; i++) {
            if(_.includes(parts, i)) {
                currentPart = [];
                points.push(currentPart);
            }

            const p = this.readPoint(buffer, offset + 16 * i);
            currentPart.push(p);
        }

        return points;
    }
};