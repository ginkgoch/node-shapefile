import ShpWriter from "../ShpWriter";
import GeomParser from "./GeomParser";
import { ShapefileType, Constants } from "../../shared";
import { Geometry, LinearRing, Polygon, ICoordinate, MultiPolygon, Envelope } from "ginkgoch-geom";

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
            return new LinearRing(r.map(p => ({ x: p[0], y: p[1] })));
        });

        if (rings.length === 1) {
            return new Polygon(rings[0]);
        } else if (rings.length > 1) {
            const multiPolygon = RingToPolygonConverter.toMultiPolygon(rings);
            if (multiPolygon.children.length === 1) {
                return multiPolygon.children[0];
            }
            else {
                return multiPolygon;
            }
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

class RingToPolygonConverter {
    static toMultiPolygon(rings: LinearRing[]) {
        const multiPolygon = new MultiPolygon();
        const innerRings = new Array<LinearRing>();
        const bounds = new Array<Envelope>();

        if (rings.length === 1) {
            multiPolygon.children.push(new Polygon(rings[0]));
        }
        else {
            for (let ring of rings) {
                if (ring.counterClockwise()) {
                    innerRings.push(ring);
                }
                else {
                    multiPolygon.children.push(new Polygon(ring));
                    bounds.push(ring.envelope());
                }
            }

            for (let innerRing of innerRings) {
                this.pushInnerRing(innerRing, multiPolygon, bounds);
            }
        }

        return multiPolygon;
    }

    static pushInnerRing(innerRing: LinearRing, multiPolygon: MultiPolygon, bounds: Array<Envelope>) {
        const innerRingBound = innerRing.envelope();
        const innerRingContainers = new Array<number>();

        for (let i = 0; i < multiPolygon.children.length; i++) {
            if (Envelope.contains(bounds[i], innerRingBound)) {
                innerRingContainers.push(i);
            }
        }

        if (innerRingContainers.length === 1) {
            multiPolygon.children[innerRingContainers[0]].internalRings.push(innerRing);
        }
        else if (innerRingContainers.length > 1) {
            for (let index of innerRingContainers) {
                const outerRing = multiPolygon.children[index].externalRing;
                const coordinateTest = innerRing._coordinates[0];
                if (this.isCoordinateOnRing(coordinateTest, outerRing)
                    || this.isCoordinateInRing(coordinateTest, outerRing)) {
                    multiPolygon.children[index].internalRings.push(innerRing);
                    break;
                }
            }
        }
        else if (innerRingContainers.length === 0) {
            multiPolygon.children.push(new Polygon(innerRing));
            bounds.push(innerRing.envelope());
        }
    }

    static isCoordinateOnRing(coordinate: ICoordinate, ring: LinearRing) {
        for (let coordinateOnRing of ring._coordinates) {
            if (coordinate.x === coordinateOnRing.x && coordinate.y === coordinateOnRing.y) {
                return true;
            }
        }

        return false;
    }

    static isCoordinateInRing(coordinate: ICoordinate, ring: LinearRing) {
        let crossings = 0;
        for (let i = 1; i < ring._coordinates.length; i++) {
            let previous = i - 1;
            const p1 = ring._coordinates[i];
            const p2 = ring._coordinates[previous];

            const x1 = p1.x - coordinate.x;
            const y1 = p1.y - coordinate.y;
            const x2 = p2.x - coordinate.x;
            const y2 = p2.y - coordinate.y;

            if ((y1 > 0 && y2 <= 0) || (y2 > 0 && y1 <= 0)) {
                const xInt = this.signOfDet2x2(x1, y1, x2, y2) / (y2 - y1);
                if (xInt > 0) {
                    crossings++;
                }
            }
        }

        return (crossings % 2 === 1);
    }

    static signOfDet2x2(x1: number, y1: number, x2: number, y2: number): number {
        let sign = 1, k;

        if (x1 === 0 || y2 === 0) {
            if (y1 === 0 || x2 === 0) {
                return 0;
            }
            else if (y1 > 0) {
                return x2 > 0 ? -sign : sign;
            }
            else {
                return x2 > 0 ? sign : -sign;
            }
        }

        if (y1 === 0 || x2 === 0) {
            if (y2 > 0) {
                return x1 > 0 ? sign : -sign;
            }
            else {
                return x1 > 0 ? -sign : sign;
            }
        }

        if (y1 > 0) {
            if (y2 > 0) {
                if (y1 > y2) {
                    sign = -sign;
                    [x1, x2] = [x2, x1];
                    [y1, y2] = [y2, y1];
                }
            }
            else {
                if (y1 <= -y2) {
                    sign = -sign;
                    x2 = -x2;
                    y2 = -y2;
                }
                else {
                    [x1, x2] = [-x2, x1];
                    [y1, y2] = [-y2, y1];
                }
            }
        }
        else {
            if (y2 > 0) {
                if (-y1 <= y2) {
                    sign = -sign;
                    x1 = -x1;
                    y1 = -y1;
                }
                else {
                    [x1, x2] = [x2, -x1];
                    [y1, y2] = [y2, -y1];
                }
            }
            else {
                if (y1 >= y2) {
                    x1 = -x1;
                    y1 = -y1;
                    x2 = -x2;
                    y2 = -y2;
                }
                else {
                    sign = -sign;
                    [x1, x2] = [-x2, -x1];
                    [y1, y2] = [-y2, -y1];
                }
            }
        }

        if (x1 > 0) {
            if (x2 > 0) {
                if (x1 > x2) {
                    return sign;
                }
            }
            else {
                return sign;
            }
        }
        else {
            if (x2 > 0) {
                return -sign;
            }
            else {
                if (x1 >= x2) {
                    sign = -sign;
                    x1 = -x1;
                    x2 = -x2;
                }
                else {
                    return -sign;
                }
            }
        }

        while (true) {
            k = Math.floor(x2 * 1.0 / x1);
            x2 = x2 - k * x1;
            y2 = y2 - k * y1;

            if (y2 < 0) {
                return -sign;
            }

            if (y2 > y1) {
                return sign;
            }

            if (x1 > x2 * 2) {
                if (y1 < y2 * 2) {
                    return sign;
                }
            }
            else {
                if (y1 > y2 * 2) {
                    return -sign;
                }
                else {
                    x2 = x1 - x2;
                    y2 = y1 - y2;
                    sign = -sign;
                }
            }

            if (y2 === 0) {
                return x2 === 0 ? 0 : -sign;
            }

            if (x2 === 0) {
                return sign;
            }

            k = Math.floor(x1 * 1.0 / x2);
            x1 = x1 - k * x2;
            y1 = y1 - k * y2;

            if (y1 < 0) {
                return sign;
            }
            if (y1 > y2) {
                return -sign;
            }

            if (x2 > x1 * 2) {
                if (y2 < y1 * 2) {
                    return -sign;
                }
            }
            else {
                if (y2 > y1 * 2) {
                    return sign;
                }
                else {
                    x1 = x2 - x1;
                    y1 = y2 - y1;
                    sign = -sign;
                }
            }

            if (y1 === 0) {
                return x1 === 0 ? 0 : sign;
            }

            if (x1 === 0) {
                return -sign;
            }
        }
    }
}