import GeomParser from "./GeomParser";
import { ShapefileType } from "../../shared/ShapefileType";
import constants from '../../shared/Constants';

export default class MultiPointParser extends GeomParser {
    get expectedType(): ShapefileType {
        return ShapefileType.multiPoint;
    } 

    _readGeom(): any {
        const numPoints = this._reader.nextInt32LE();
        const points = new Array<number[]>();

        for (let i = 0; i < numPoints; i++) {
            points.push(this._reader.nextPoint());
        }

        return points;
    }

    get expectedTypeName(): string {
        return constants.GEOM_TYPE_MULTIPOINT;
    }
}