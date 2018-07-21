module.exports = function (buffer) {
    const type = buffer.readInt32LE(0);
    if (type !== 1) throw 'Not a point record.';

    const x = buffer.readDoubleLE(4);
    const y = buffer.readDoubleLE(12);
    return { geom: { x, y } };
};