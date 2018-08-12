const Validators = require('../../Validators');
const GEOM_TYPE_POLYGON = 'Polygon';

module.exports = function(br) {
    const type = br.nextInt32LE();
    Validators.checkIsValidShapeType(type, 5, 'polygon');

    const envelope = br.nextEnvelope(); 
    const readGeom = function() {
        const numParts = br.nextInt32LE(); 
        const numPoints = br.nextInt32LE(); 
        const parts = br.nextParts(numParts); 
        const points = br.nextPointsByParts(numPoints, parts); 
        return { type: GEOM_TYPE_POLYGON, coordinates: points };
    };
    
    return { envelope, readGeom };
};