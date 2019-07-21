import GeomParser from "./GeomParser";
import IEnvelope from "../IEnvelope";
import Envelope from "../Envelope";
import * as shared from '../../shared';

export default class PointParser extends GeomParser {
    //TODO: test constructor

    get expectedType(): shared.ShapefileType {
        return shared.ShapefileType.point;
    }

    protected _prepare(): {envelope: IEnvelope, readGeom: () => {type: shared.ShapefileType, coordinates: any}} {
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
        return shared.Constants.GEOM_TYPE_POINT;
    }
}