const ParserHelper = require('./ParserHelper');
const Validators = require('../Validators');

module.exports = function(buffer) {
    const type = buffer.readInt32LE(0);
    Validators.checkIsValidShapeType(type, 5, 'polygon');

    const envelope = ParserHelper.readEnvelope(buffer, 4);
    const numParts = buffer.readInt32LE(36);
    const numPoints = buffer.readInt32LE(40);
    const parts = ParserHelper.readParts(buffer, numParts, 44);
    const points = ParserHelper.readPointsByParts(buffer, numPoints, 44 + numParts * 4, parts);
    return { geom: points, envelope };
};