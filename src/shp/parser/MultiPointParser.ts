import GeomParser from "./GeomParser";
import { ShapefileType, Constants } from "../../shared";
import ShpWriter from "../ShpWriter";
import { getConsoleOutput } from "@jest/console";

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
        return Constants.GEOM_TYPE_MULTIPOINT;
    }

    protected _write(coordinates: any, writer: ShpWriter): void {
        let geom = coordinates as number[][];
        writer.writeInt32LE(geom.length);
        geom.forEach(p => {
            writer.writePoint(p);
        });
    }
}