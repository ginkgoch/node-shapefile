import Parser from "./Parser";
import IEnvelope from "../IEnvelope";
import Envelope from "../Envelope";
import { ShapefileType } from "../../shared/ShapefileType";

export default class PointParser extends Parser {
    //TODO: test constructor

    get expectedType(): ShapefileType {
        return ShapefileType.point;
    }

    protected _prepare(): {envelope: IEnvelope, readGeom: () => {type: ShapefileType, coordinates: any}} {
        const geom = this.reader.nextPoint();
        this.envelope = new Envelope(geom[0], geom[1], geom[0], geom[1]);

        return { envelope: this.envelope, readGeom: this.readGeom };
    }
    
    protected _readGeom(): any {
        const x = (<IEnvelope>this.envelope).minx;
        const y = (<IEnvelope>this.envelope).miny;
        return [x, y];
    }
}