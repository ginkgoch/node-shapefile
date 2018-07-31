const _ = require('lodash');
const Validators = require('../../Validators');

module.exports = function (br) {
    const type = br.nextInt32LE(); 
    Validators.checkIsValidShapeType(type, 3, 'polyline');

    const envelope = br.nextEnvelope();
    const readGeom = function() {
        const numParts = br.nextInt32LE(); 
        const numPoints = br.nextInt32LE(); 
        const parts = _.range(numParts).map(i => br.nextInt32LE());
        const points = br.nextPointsByParts(numPoints, parts); 
        return { type: 3, coords: points };
    };
    
    return { envelope, readGeom };
}