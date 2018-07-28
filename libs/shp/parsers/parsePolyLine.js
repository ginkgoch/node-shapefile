const _ = require('lodash');
const Validators = require('../../Validators');
const ShpReader = require('../ShpReader');

module.exports = function (buffer, filter) {
    const br = new ShpReader(buffer);
    const type = br.nextInt32LE(); 
    Validators.checkIsValidShapeType(type, 3, 'polyline');

    const envelope = br.nextEnvelope();
    if (envelope.disjoined(filter)) return null;

    const numParts = br.nextInt32LE(); 
    const numPoints = br.nextInt32LE(); 
    const parts = _.range(numParts).map(i => br.nextInt32LE());
    const points = br.nextPointsByParts(numPoints, parts); 

    return {
        geom: points
    };
}