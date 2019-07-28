import ShpWriter from "../ShpWriter";
import GeomParser from "./GeomParser";
import { IEnvelope, Envelope, Geometry, Point } from "ginkgoch-geom";
import { ShapefileType, Constants } from "../../shared";

export default class PointParser extends GeomParser {
    get expectedType(): ShapefileType {
        return ShapefileType.point;
    }

    protected _read(): { envelope: IEnvelope, readGeom: () => Geometry } {
        const geom = this._reader.nextPoint();
        this.envelope = new Envelope(geom[0], geom[1], geom[0], geom[1]);

        return { envelope: this.envelope, readGeom: this.readGeom.bind(this) };
    }

    protected _readGeom(): Geometry {
        const x = (<IEnvelope>this.envelope).minx;
        const y = (<IEnvelope>this.envelope).miny;
        return new Point(x, y);
    }

    get expectedTypeName(): string {
        return Constants.GEOM_TYPE_POINT;
    }

    protected _write(coordinates: any, writer: ShpWriter): void {
        writer.writePoint(coordinates as number[]);
    }

    protected _size(coordinates: any): number {
        return 4 + Constants.SIZE_OF_POINT;
    }
}