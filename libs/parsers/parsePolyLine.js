const _ = require('lodash');
const Validators = require('../Validators');
const RecordReader = require('../RecordReader');

module.exports = function (buffer) {
    const br = new RecordReader(buffer);
    const type = br.nextInt32LE(); 
    Validators.checkIsValidShapeType(type, 3, 'polyline');

    const envelope = br.nextEnvelope();
    const numParts = br.nextInt32LE(); 
    const numPoints = br.nextInt32LE(); 
    const parts = _.range(numParts).map(i => br.nextInt32LE());
    const points = br.nextPointsByParts(numPoints, parts); 

    return {
        envelope,
        geom: points
    };
}