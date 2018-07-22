const _ = require('lodash');
const ParserHelper = require('./ParserHelper');
const Validators = require('../Validators');

module.exports = function (buffer) {
    const type = buffer.readInt32LE(0);
    Validators.checkIsValidShapeType(type, 3, 'polyline');

    const envelope = ParserHelper.readEnvelope(buffer, 4);
    const numParts = buffer.readInt32LE(36);
    const numPoints = buffer.readInt32LE(40);
    const parts = _.range(numParts).map(i => buffer.readInt32LE(44 + i * 4));

    const position = 44 + numParts * 4;
    const points = ParserHelper.readPointsByParts(buffer, numPoints, position, parts);

    // const points = [];
    // let pointsInPart = undefined;
    // for (let i = 0; i < numPoints; i++) {
    //     if(_.includes(parts, i)) {
    //         pointsInPart = [];
    //         points.push(pointsInPart);
    //     }

    //     let [x, y] = [buffer.readDoubleLE(position + 16 * i), buffer.readDoubleLE(position + 16 * i + 8)];
    //     pointsInPart.push({ x, y });
    // }

    return {
        envelope,
        geom: points
    };
}