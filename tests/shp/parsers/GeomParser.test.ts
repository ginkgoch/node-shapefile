import * as shared from '../../../src/shared';
import ShpReader from "../../../src/shp/ShpReader";
import GeomParser from "../../../src/shp/parser/GeomParser";
import GeomParserFactory from "../../../src/shp/parser/GeomParserFactory";
import ShpWriter from '../../../src/shp/ShpWriter';

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
        let geom: any = [24, 85];
        let vertices = GeomParser.vertices(geom);
        expect(vertices).toEqual([[24, 85]]);

        geom = [[24, 85], [45, 98]];
        vertices = GeomParser.vertices(geom);
        expect(vertices).toEqual([[24, 85], [45, 98]]);

        geom = [[[24, 85], [45, 98]], [34, 81]];
        vertices = GeomParser.vertices(geom);
        expect(vertices).toEqual([[24, 85], [45, 98], [34, 81]]);

        let r = typeof geom
        console.log(r);
    });

    it('write - point', () => {
        let buff = Buffer.alloc(256);
        const writer = new ShpWriter(buff);
        const reader = new ShpReader(buff);
        const point1 = [45, 56];

        const parser = GeomParserFactory.getParser(shared.ShapefileType.point);
        parser.value.write(point1, writer);
        const geomInfo = parser.value.read(reader) as any;
        const geom = geomInfo.readGeom();
        expect(geom.coordinates).toEqual(point1);
    });

    it('write - line', () => {
        let buff = Buffer.alloc(256);
        const writer = new ShpWriter(buff);
        const reader = new ShpReader(buff);
        const line = [[45, 56], [78, 98]];

        const parser = GeomParserFactory.getParser(shared.ShapefileType.polyLine);
        parser.value.write(line, writer);
        const geomInfo = parser.value.read(reader) as any;
        const geom = geomInfo.readGeom();
        expect(geom.coordinates).toEqual(line);
    });

    it('write - multi line', () => {
        let buff = Buffer.alloc(256);
        const writer = new ShpWriter(buff);
        const reader = new ShpReader(buff);
        const line = [[[45, 56], [78, 98]], [[34, 97], [46, 23]]];

        const parser = GeomParserFactory.getParser(shared.ShapefileType.polyLine);
        parser.value.write(line, writer);
        const geomInfo = parser.value.read(reader) as any;
        const geom = geomInfo.readGeom();
        expect(geom.coordinates).toEqual(line);
    });

    it('write - polygon', () => {
        let buff = Buffer.alloc(256);
        const writer = new ShpWriter(buff);
        const reader = new ShpReader(buff);
        const line = [[[45, 56], [78, 98]], [[34, 97], [46, 23]]];

        const parser = GeomParserFactory.getParser(shared.ShapefileType.polygon);
        parser.value.write(line, writer);
        const geomInfo = parser.value.read(reader) as any;
        const geom = geomInfo.readGeom();
        expect(geom.coordinates).toEqual(line);
    });
});