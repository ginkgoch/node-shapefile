const _ = require('lodash');
const Validators = require('../../Validators');
const Envelope = require('../Envelope');

module.exports = function (br) {
    const type = br.nextInt32LE();
    Validators.checkIsValidShapeType(type, 1, 'point');

    let geom = br.nextPoint();
    const envelope =  new Envelope(geom.x, geom.y, geom.x, geom.y);
    const readGeom = function() {
        return { type: 1, coords: geom };
    }

    return { readGeom, envelope };
};