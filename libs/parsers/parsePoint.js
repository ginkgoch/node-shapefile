const Validators = require('../Validators');
const RecordReader = require('../RecordReader');

module.exports = function (buffer) {
    const br = new RecordReader(buffer);
    const type = br.nextInt32LE();
    Validators.checkIsValidShapeType(type, 1, 'point');

    const geom = br.nextPoint();
    return { geom, envelope: { minx: geom.x, miny: geom.y, maxx: geom.x, maxy: geom.y } };
};