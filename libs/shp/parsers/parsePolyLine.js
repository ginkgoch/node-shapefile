const _ = require('lodash');
const Validators = require('../../Validators');
const GEOM_TYPE_LINE = 'LineString';

module.exports = function (br) {
    const type = br.nextInt32LE();
    if (type === 0) {
        // null shape type, means this record is deleted.
        return null;
    }

    Validators.checkIsValidShapeType(type, 3, 'polyline');

    const envelope = br.nextEnvelope();
    const readGeom = function() {
        const numParts = br.nextInt32LE(); 
        const numPoints = br.nextInt32LE(); 
        const parts = _.range(numParts).map(i => br.nextInt32LE());
        let points = br.nextPointsByParts(numPoints, parts); 

        if (points.length === 1) {
            points = _.first(points);
        }
        return { type: GEOM_TYPE_LINE, coordinates: points };
    };
    
    return { envelope, readGeom };
};