const Validators = require('../Validators');

module.exports = function (buffer) {
    const type = buffer.readInt32LE(0);
    Validators.checkIsValidShapeType(type, 1, 'point');

    const x = buffer.readDoubleLE(4);
    const y = buffer.readDoubleLE(12);
    
    return { geom: { x, y }, envelope: { x, y, x, y } };
};