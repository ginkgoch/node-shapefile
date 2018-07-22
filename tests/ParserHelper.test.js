const ParserHelper = require('../libs/parsers/ParserHelper');

describe('parser helper tests', () => {
    const src = { minx: -120.0236, miny: -140.8975, maxx: 98.98, maxy: 34.8765 };

    test('read envelope test 1', () => {
        const buffer = Buffer.alloc(32);
        buffer.writeDoubleLE(src.minx, 0);
        buffer.writeDoubleLE(src.miny, 8);
        buffer.writeDoubleLE(src.maxx, 16);
        buffer.writeDoubleLE(src.maxy, 24);

        const newEnv = ParserHelper.readEnvelope(buffer);
        expect(newEnv).toEqual(src);
    });

    test('read envelope test 2', () => {
        const buffer = Buffer.alloc(40);
        buffer.writeInt32LE(1, 0);
        buffer.writeInt32LE(2, 4);
        buffer.writeDoubleLE(src.minx, 8);
        buffer.writeDoubleLE(src.miny, 16);
        buffer.writeDoubleLE(src.maxx, 24);
        buffer.writeDoubleLE(src.maxy, 32);

        const newEnv = ParserHelper.readEnvelope(buffer, 8);
        expect(newEnv).toEqual(src);
    });
});