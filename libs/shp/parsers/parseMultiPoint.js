const Validators = require('../../Validators');
const ShpReader = require('../ShpReader');

module.exports = function (buffer, filter) {
    const br = new ShpReader(buffer);
    const type = br.readInt32LE();
    Validators.checkIsValidShapeType(type, 8, 'multipoint');

    const envelope = br.nextEnvelope();
    if (envelope.disjoined(filter)) return null;

    const numPoints = br.nextIn32LE(); 
    const points = [];

    for (let i = 0; i < numPoints; i++) {
        points.push(br.nextPoint());
    }

    return { geom: points };
};