import GeomParser from "./GeomParser";
import IEnvelope from "../IEnvelope";
import Envelope from "../Envelope";
import { ShapefileType } from "../../shared/ShapefileType";
import constants from '../../shared/Constants';

export default class PointParser extends GeomParser {
    //TODO: test constructor

    get expectedType(): ShapefileType {
        return ShapefileType.point;
    }

    protected _prepare(): {envelope: IEnvelope, readGeom: () => {type: ShapefileType, coordinates: any}} {
        const geom = this._reader.nextPoint();
        this.envelope = new Envelope(geom[0], geom[1], geom[0], geom[1]);

        return { envelope: this.envelope, readGeom: this.readGeom };
    }
    
    protected _readGeom(): any {
        const x = (<IEnvelope>this.envelope).minx;
        const y = (<IEnvelope>this.envelope).miny;
        return [x, y];
    }

    get expectedTypeName(): string {
        return constants.GEOM_TYPE_POINT;
    }
}