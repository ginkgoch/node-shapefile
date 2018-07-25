const Validators = require('../Validators');
const RecordReader = require('../RecordReader');

module.exports = function (buffer) {
    const br = new RecordReader(buffer);
    const type = br.readInt32LE();
    Validators.checkIsValidShapeType(type, 8, 'multipoint');

    const envelope = br.nextEnvelope();
    const numPoints = br.nextIn32LE(); 
    const points = [];

    for (let i = 0; i < numPoints; i++) {
        points.push(br.nextPoint());
    }

    return { geom: points, envelope };
};