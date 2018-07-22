const ParserHelper = require('./ParserHelper');
const Validators = require('../Validators');

module.exports = function (buffer) {
    const type = buffer.readInt32LE(0);
    Validators.checkIsValidShapeType(type, 8, 'multipoint');

    const envelope = ParserHelper.readEnvelope(buffer, 4);
    const numPoints = buffer.readInt32LE(36);
    const points = [];

    for (let i = 0; i < numPoints; i++) {
        points.push(ParserHelper.readPoint(buffer, 40 + i * 16));
    }

    return { geom: points, envelope };
};