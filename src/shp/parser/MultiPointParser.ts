import GeomParser from "./GeomParser";
import { ShapefileType, Constants } from "../../shared";
import ShpWriter from "../ShpWriter";
import { Geometry, MultiPoint, Point } from "ginkgoch-geom";

export default class MultiPointParser extends GeomParser {
    get expectedType(): ShapefileType {
        return ShapefileType.multiPoint;
    }

    _readGeom(): Geometry {
        const numPoints = this._reader.nextInt32LE();
        const points = new Array<number[]>();

        for (let i = 0; i < numPoints; i++) {
            points.push(this._reader.nextPoint());
        }

        return new MultiPoint(points.map(p => new Point(p[0], p[1])));
    }

    get expectedTypeName(): string {
        return Constants.GEOM_TYPE_MULTIPOINT;
    }

    protected _write(coordinates: any, writer: ShpWriter): void {
        const geom = coordinates as number[][];
        writer.writeInt32LE(geom.length);
        geom.forEach(p => {
            writer.writePoint(p);
        });
    }

    protected _size(coordinates: any): number {
        const vertices = coordinates as number[][];

        /**
         * type - 4
         * envelope
         * point count - 4
         * points
         */
        return 4 + Constants.SIZE_ENVELOPE + 4 + Constants.SIZE_POINT * vertices.length;
    }
}