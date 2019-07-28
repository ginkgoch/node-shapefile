import _ from "lodash";
import ShpWriter from "../ShpWriter";
import GeomParser from "./GeomParser";
import { ShapefileType, Constants } from "../../shared";
import { Geometry, LineString, MultiLineString } from "ginkgoch-geom";

export default class PolyLineParser extends GeomParser {
    get expectedType(): ShapefileType {
        return ShapefileType.polyLine;
    }

    protected _readGeom(): Geometry {
        const numParts = this._reader.nextInt32LE();
        const numPoints = this._reader.nextInt32LE();
        const parts = _.range(numParts).map(i => this._reader.nextInt32LE());
        let points = this._reader.nextPointsByParts(numPoints, parts);

        if (points.length === 1) {
            return new LineString(points[0].map(p => ({x: p[0], y: p[1]})));
        } else if (points.length > 1) {
            return new MultiLineString(points.map(l => {
                return new LineString(l.map(p => ({x: p[0], y: p[1]})));
            }));
        } else {
            return new LineString();
        }
    }

    get expectedTypeName(): string {
        return Constants.GEOM_TYPE_POLYLINE;
    }

    protected _write(coordinates: any, writer: ShpWriter): void {
        const geom = this._normalize(coordinates);

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

    private _normalize(coordinates: any) {
        if (!_.isArray(coordinates[0][0])) {
            coordinates = [coordinates];
        }

        const geom = coordinates as number[][][];
        return geom;
    }

    protected _size(coordinates: any): number {
        const geom = this._normalize(coordinates);

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
        return 4 + Constants.SIZE_OF_ENVELOPE + 4 + 4 + 4 * parts.length + Constants.SIZE_OF_POINT * vertices.length;
    }
}