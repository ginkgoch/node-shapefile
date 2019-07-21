import GeomParserFactory from "../../../src/shp/parser/GeomParserFactory";
import { ShapefileType } from "../../../src/shared/ShapefileType";
import ShpReader from "../../../src/shp/ShpReader";

// const Parser = require('../libs/shp/ShpParser');
// const ShapefileType = require('../libs/ShapefileType');
// const ShpReader = require('../libs/shp/ShpReader');

describe('parser tests', () => {
    test('get parsers test', () => {
        let pointParser = GeomParserFactory.getParser(ShapefileType.point);
        expect(pointParser).not.toBeNull();

        let polyLineParser = GeomParserFactory.getParser(ShapefileType.polyLine);
        expect(polyLineParser).not.toBeNull();

        let multiPointParser = GeomParserFactory.getParser(ShapefileType.multiPoint);
        expect(multiPointParser).not.toBeNull();

        let polygonParser = GeomParserFactory.getParser(ShapefileType.polygon);
        expect(polygonParser).not.toBeNull();
    });

    test('get unsupported parser test', () => {
        let parser = GeomParserFactory.getParser(1000000);
        expect(parser.hasValue).toBeFalsy();
    });

    test('null shape parser test', () => {
        let parser = GeomParserFactory.getParser(ShapefileType.nullShape);
        expect(parser.hasValue).toBeFalsy();
    });

    test('point shape parser test', () => {
        let [type, x, y] = [1, 34.5634, -89.2357];

        const buffer = Buffer.alloc(20);
        buffer.writeInt32LE(type, 0);
        buffer.writeDoubleLE(x, 4);
        buffer.writeDoubleLE(y, 12);
        let obj = GeomParserFactory.getParser(ShapefileType.point);
        expect(obj.hasValue).toBeTruthy();

        obj.value.prepare(new ShpReader(buffer));
        let geom = obj.value.readGeom();
        expect(geom).toEqual({ type: ShapefileType.point, coordinates: [x, y] });
    });

    test('point shape parser test - incorrect buffer', () => {
        let [type, x, y] = [2, 34.5634, -89.2357];

        const buffer = Buffer.alloc(20);
        buffer.writeInt32LE(type, 0);
        buffer.writeDoubleLE(x, 4);
        buffer.writeDoubleLE(y, 12);

        function parsePointBuffer() {
            let parser = GeomParserFactory.getParser(ShapefileType.point);
            parser.value.prepare(new ShpReader(buffer));
        }
        expect(parsePointBuffer).toThrow(/Not a point record/);
    });
});