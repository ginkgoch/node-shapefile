const Parser = require('../libs/shp/ShpParser');
const ShapefileType = require('../libs/ShapefileType');
const ShpReader = require('../libs/shp/ShpReader');

describe('parser tests', () => {
    test('get parsers test', () => {
        let pointParser = Parser.getParser(ShapefileType.point);
        expect(pointParser).not.toBeNull();

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
        expect(() => {
            Parser.getParser(ShapefileType.nullShape);
        }).toThrow(/Unsupported/);
    });

    test('point shape parser test', () => {
        let [type, x, y] = [1, 34.5634, -89.2357];

        const buffer = Buffer.alloc(20);
        buffer.writeInt32LE(type, 0);
        buffer.writeDoubleLE(x, 4);
        buffer.writeDoubleLE(y, 12);
        let obj = Parser.getParser(ShapefileType.point)(new ShpReader(buffer));
        obj = obj.readGeom();
        expect(obj).toEqual({ type:'Point', coordinates: [x, y] });
    });

    test('point shape parser test - incorrect buffer', () => {
        let [type, x, y] = [2, 34.5634, -89.2357];

        const buffer = Buffer.alloc(20);
        buffer.writeInt32LE(type, 0);
        buffer.writeDoubleLE(x, 4);
        buffer.writeDoubleLE(y, 12);

        function parsePointBuffer() {
            Parser.getParser(ShapefileType.point)(new ShpReader(buffer));
        }
        expect(parsePointBuffer).toThrow(/Not a point record/);
    });
});