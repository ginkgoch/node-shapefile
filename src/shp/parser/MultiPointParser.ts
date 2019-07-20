import Parser from "./Parser";
import { ShapefileType } from "../../shared/ShapefileType";

export default class MultiPointParser extends Parser {
    get expectedType(): ShapefileType {
        return ShapefileType.multiPoint;
    } 

    _readGeom(): any {
        const numPoints = this.reader.nextInt32LE();
        const points = new Array<number[]>();

        for (let i = 0; i < numPoints; i++) {
            points.push(this.reader.nextPoint());
        }

        return points;
    }
}