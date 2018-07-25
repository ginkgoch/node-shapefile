const Parser = require('../libs/RecordParser');
const ShapefileType = require('../libs/ShapefileType');

describe('parser tests', () => {
    test('get parsers test', () => {
        let pointParser = Parser.getParser(1);
        expect(pointParser).not.toBeNull();

        pointParser = Parser.getParser(ShapefileType.point);
        expect(pointParser).not.toBeNull();

        let nullShapeParser = Parser.getParser(ShapefileType.nullShape);
        expect(nullShapeParser).not.toBeNull();

        let polyLineParser = Parser.getParser(ShapefileType.polyLine);
        expect(polyLineParser).not.toBeNull();

        let multiPointParser = Parser.getParser(ShapefileType.multiPoint);
        expect(multiPointParser).not.toBeNull();

        let polygonParser = Parser.getParser(ShapefileType.polygon);
        expect(polygonParser).not.toBeNull();
    });

    test('get unsupported parser test', () => {
        expect(() => {
            Parser.getParser(1000000);
        }).toThrow(/Unsupported/);
    });

    test('null shape parser test', () => {
        let obj = Parser.getParser(ShapefileType.nullShape)(Buffer.from([0]));
        expect(obj).toEqual({ geom: null });
    });

    test('point shape parser test', () => {
        let [type, x, y] = [1, 34.5634, -89.2357];

        const buffer = Buffer.alloc(20);
        buffer.writeInt32LE(type, 0);
        buffer.writeDoubleLE(x, 4);
        buffer.writeDoubleLE(y, 12);
        let obj = Parser.getParser(ShapefileType.point)(buffer);
        expect(obj).toEqual({ geom: { x, y }, envelope: { minx: x, miny: y, maxx: x, maxy: y } });
    });

    test('point shape parser test - incorrect buffer', () => {
        let [type, x, y] = [2, 34.5634, -89.2357];

        const buffer = Buffer.alloc(20);
        buffer.writeInt32LE(type, 0);
        buffer.writeDoubleLE(x, 4);
        buffer.writeDoubleLE(y, 12);

        function parsePointBuffer() {
            Parser.getParser(ShapefileType.point)(buffer);
        }
        expect(parsePointBuffer).toThrow(/Not a point record/);
    });
});