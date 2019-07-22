import GeomParserFactory from "../../../src/shp/parser/GeomParserFactory";
import ShpReader from "../../../src/shp/ShpReader";
import * as shared from '../../../src/shared';

describe('parser tests', () => {
    test('get parsers test', () => {
        let pointParser = GeomParserFactory.getParser(shared.ShapefileType.point);
        expect(pointParser).not.toBeNull();

        let polyLineParser = GeomParserFactory.getParser(shared.ShapefileType.polyLine);
        expect(polyLineParser).not.toBeNull();

        let multiPointParser = GeomParserFactory.getParser(shared.ShapefileType.multiPoint);
        expect(multiPointParser).not.toBeNull();

        let polygonParser = GeomParserFactory.getParser(shared.ShapefileType.polygon);
        expect(polygonParser).not.toBeNull();
    });

    test('get unsupported parser test', () => {
        let parser = GeomParserFactory.getParser(1000000);
        expect(parser.hasValue).toBeFalsy();
    });

    test('null shape parser test', () => {
        let parser = GeomParserFactory.getParser(shared.ShapefileType.nullShape);
        expect(parser.hasValue).toBeFalsy();
    });

    test('point shape parser test', () => {
        let [type, x, y] = [1, 34.5634, -89.2357];

        const buffer = Buffer.alloc(20);
        buffer.writeInt32LE(type, 0);
        buffer.writeDoubleLE(x, 4);
        buffer.writeDoubleLE(y, 12);
        let obj = GeomParserFactory.getParser(shared.ShapefileType.point);
        expect(obj.hasValue).toBeTruthy();

        obj.value.read(new ShpReader(buffer));
        let geom = obj.value.readGeom();
        expect(geom).toEqual({ type: shared.ShapefileType.point, coordinates: [x, y] });
    });

    test('point shape parser test - incorrect buffer', () => {
        let [type, x, y] = [2, 34.5634, -89.2357];

        const buffer = Buffer.alloc(20);
        buffer.writeInt32LE(type, 0);
        buffer.writeDoubleLE(x, 4);
        buffer.writeDoubleLE(y, 12);

        function parsePointBuffer() {
            let parser = GeomParserFactory.getParser(shared.ShapefileType.point);
            parser.value.read(new ShpReader(buffer));
        }
        expect(parsePointBuffer).toThrow(/Not a point record/);
    });

    test('vertices', () => {
        let parser = GeomParserFactory.getParser(shared.ShapefileType.point);
        
        let geom: any = [24, 85];
        let vertices = parser.value.vertices(geom);
        expect(vertices).toEqual([[24, 85]]);

        geom = [[24, 85], [45, 98]];
        vertices = parser.value.vertices(geom);
        expect(vertices).toEqual([[24, 85], [45, 98]]);

        geom = [[[24, 85], [45, 98]], [34, 81]];
        vertices = parser.value.vertices(geom);
        expect(vertices).toEqual([[24, 85], [45, 98], [34, 81]]);
    });
});