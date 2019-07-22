import GeomParser from "./GeomParser";
import IEnvelope from "../IEnvelope";
import Envelope from "../Envelope";
import { ShapefileType, Constants } from "../../shared";
import ShpWriter from "../ShpWriter";

export default class PointParser extends GeomParser {

    get expectedType(): ShapefileType {
        return ShapefileType.point;
    }

    protected _read(): {envelope: IEnvelope, readGeom: () => {type: ShapefileType, coordinates: any}} {
        const geom = this._reader.nextPoint();
        this.envelope = new Envelope(geom[0], geom[1], geom[0], geom[1]);

        return { envelope: this.envelope, readGeom: this.readGeom.bind(this) };
    }
    
    protected _readGeom(): any {
        const x = (<IEnvelope>this.envelope).minx;
        const y = (<IEnvelope>this.envelope).miny;
        return [x, y];
    }

    get expectedTypeName(): string {
        return Constants.GEOM_TYPE_POINT;
    }

    protected _write(coordinates: any, writer: ShpWriter): void {
        writer.writePoint(coordinates as number[])
    }
}