const _ = require('lodash');

module.exports = function (buffer) {
    const type = buffer.readInt32LE(0);
    if(type !== 3) throw 'Not a polyline record.';

    const minx = buffer.readDoubleLE(4);
    const miny = buffer.readDoubleLE(12);
    const maxx = buffer.readDoubleLE(20);
    const maxy = buffer.readDoubleLE(28);
    const numParts = buffer.readInt32LE(36);
    const numPoints = buffer.readInt32LE(40);
    const parts = _.range(numParts).map(i => buffer.readInt32LE(44 + i * 4));

    const position = 44 + numParts * 4;
    const points = [];
    let pointsInPart = undefined;
    for (let i = 0; i < numPoints; i++) {
        if(_.includes(parts, i)) {
            pointsInPart = [];
            points.push(pointsInPart);
        }

        let [x, y] = [buffer.readDoubleLE(position + 16 * i), buffer.readDoubleLE(position + 16 * i + 8)];
        pointsInPart.push({ x, y });
    }

    return {
        envelope: { minx, miny, maxx, maxy },
        geom: points
    };
}