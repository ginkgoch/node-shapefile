import ShpWriter from "../ShpWriter";
import GeomParser from "./GeomParser";
import { ShapefileType, Constants } from "../../shared";
import { Geometry, LinearRing, Polygon } from "ginkgoch-geom";

export default class PolygonParser extends GeomParser {
    get expectedType(): ShapefileType {
        return ShapefileType.polygon
    }

    protected _readGeom(): Geometry {
        const numParts = this._reader.nextInt32LE();
        const numPoints = this._reader.nextInt32LE();
        const parts = this._reader.nextParts(numParts);
        const points = this._reader.nextPointsByParts(numPoints, parts);
        
        const rings = points.map(r => {
            return new LinearRing(r.map(p => ({x: p[0], y: p[1]})));
        });

        if (rings.length === 1) {
            return new Polygon(rings[0]);
        } else if (rings.length > 1) {
            return new Polygon(rings[0], ...rings.slice(1));
        } else {
            return new Polygon();
        }
    }

    get expectedTypeName(): string {
        return Constants.GEOM_TYPE_POLYGON;
    }

    protected _write(coordinates: any, writer: ShpWriter): void {
        const geom = coordinates as number[][][];

        let numParts = geom.length;
        let parts = [];
        let numPoints = 0;
        let points = new Array<number[]>();
        for (let i = 0; i < geom.length; i++) {
            parts.push(numPoints);
            for (let j = 0; j < geom[i].length; j++) {
                points.push(geom[i][j]);
                numPoints++;
            }
        }

        writer.writeInt32LE(numParts);
        writer.writeInt32LE(numPoints);
        writer.writeParts(parts);
        points.forEach(p => {
            writer.writePoint(p);
        });
    }

    protected _size(coordinates: any): number {
        const geom = coordinates as number[][][];

        let parts = [];
        let numPoints = 0;
        let vertices = new Array<number[]>();
        for (let i = 0; i < geom.length; i++) {
            parts.push(numPoints);
            for (let j = 0; j < geom[i].length; j++) {
                vertices.push(geom[i][j]);
                numPoints++;
            }
        }

        /**
         * type - 4
         * envelope
         * part count - 4
         * point count - 4
         * parts
         * points
         */
        return 4 + Constants.SIZE_ENVELOPE + 4 + 4 + 4 * parts.length + Constants.SIZE_POINT * vertices.length;
    }
}