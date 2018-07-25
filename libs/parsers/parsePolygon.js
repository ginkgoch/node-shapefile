const Validators = require('../Validators');
const RecordReader = require('../RecordReader');

module.exports = function(buffer) {
    const br = new RecordReader(buffer);
    const type = br.nextInt32LE();
    Validators.checkIsValidShapeType(type, 5, 'polygon');

    const envelope = br.nextEnvelope(); 
    const numParts = br.nextInt32LE(); 
    const numPoints = br.nextInt32LE(); 
    const parts = br.nextParts(numParts); 
    const points = br.nextPointsByParts(numPoints, parts); 
    return { geom: points, envelope };
};