import GeomParserFactory from "../../../src/shp/parser/GeomParserFactory";
import { ShapefileType } from "../../../src/shared/ShapefileType";

describe('GeomParserFactory', () => {
    it('getParser', () => {
        checkGeomParserCreator(ShapefileType.point);
        checkGeomParserCreator(ShapefileType.polyLine);
        checkGeomParserCreator(ShapefileType.polygon);
        checkGeomParserCreator(ShapefileType.multiPoint);
        checkGeomParserCreator(ShapefileType.nullShape, false);
    });
});

function checkGeomParserCreator(type: ShapefileType, supported = true) {
    let parser = GeomParserFactory.create(type);
    if (supported) {
        expect(parser.hasValue).toBeTruthy()
        expect(parser.value.expectedType).toBe(type);
    } else {
        expect(parser.hasValue).toBeFalsy()
    }
}