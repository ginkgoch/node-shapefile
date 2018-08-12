const Validators = require('../../Validators');
const Envelope = require('../Envelope');
const GEOM_TYPE_POINT = 'Point';

module.exports = function (br) {
    const type = br.nextInt32LE();
    Validators.checkIsValidShapeType(type, 1, 'point');

    const geom = br.nextPoint();
    const envelope =  new Envelope(geom.x, geom.y, geom.x, geom.y);
    const readGeom = function() {
        return { type: GEOM_TYPE_POINT, coordinates: geom };
    }

    return { readGeom, envelope };
};