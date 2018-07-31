const _ = require('lodash');
const Validators = require('../../Validators');
const Envelope = require('../Envelope');

module.exports = function (br) {
    const type = br.nextInt32LE();
    Validators.checkIsValidShapeType(type, 1, 'point');

    const geom = br.nextPoint();
    const envelope =  new Envelope(geom.x, geom.y, geom.x, geom.y);
    const readGeom = function() {
        return { type: 'Point', coordinates: geom };
    }

    return { readGeom, envelope };
};