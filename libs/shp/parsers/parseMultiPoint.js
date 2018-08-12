const Validators = require('../../Validators');
const GEOM_TYPE_MULTIPOINT = 'MultiPoint';

module.exports = function (br) {
    const type = br.readInt32LE();
    Validators.checkIsValidShapeType(type, 8, 'multipoint');

    const envelope = br.nextEnvelope();

    function readGeom() {
        const numPoints = br.nextIn32LE();
        const points = [];

        for (let i = 0; i < numPoints; i++) {
            points.push(br.nextPoint());
        }
        return { type: GEOM_TYPE_MULTIPOINT, coordinates: points };
    }
    
    return { envelope, readGeom };
};