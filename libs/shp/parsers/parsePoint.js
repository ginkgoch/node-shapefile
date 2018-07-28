const Validators = require('../../Validators');
const ShpReader = require('../ShpReader');
const Envelope = require('./Envelope');

module.exports = function (buffer, filter) {
    const br = new ShpReader(buffer);
    const type = br.nextInt32LE();
    Validators.checkIsValidShapeType(type, 1, 'point');

    const geom = br.nextPoint();
    const envelope =  new Envelope(geom.x, geom.y, geom.x, geom.y);
    if (envelope.disjoined(filter)) return null;

    return { geom };
};