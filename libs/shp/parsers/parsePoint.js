const Validators = require('../../Validators');
const ShpReader = require('../ShpReader');

module.exports = function (buffer) {
    const br = new ShpReader(buffer);
    const type = br.nextInt32LE();
    Validators.checkIsValidShapeType(type, 1, 'point');

    const geom = br.nextPoint();
    return { geom, envelope: { minx: geom.x, miny: geom.y, maxx: geom.x, maxy: geom.y } };
};