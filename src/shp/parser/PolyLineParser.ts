import _ from "lodash";
import ShpWriter from "../ShpWriter";
import GeomParser from "./GeomParser";
import { ShapefileType, Constants } from "../../shared";

export default class PolyLineParser extends GeomParser {
    get expectedType(): ShapefileType {
        return ShapefileType.polyLine;
    }  
    
    protected _readGeom(): any {
        const numParts = this._reader.nextInt32LE(); 
        const numPoints = this._reader.nextInt32LE(); 
        const parts = _.range(numParts).map(i => this._reader.nextInt32LE());
        let points: any = this._reader.nextPointsByParts(numPoints, parts); 

        if (points.length === 1) {
            points = _.first(points);
        }

        return points;
    }

    get expectedTypeName(): string {
        return Constants.GEOM_TYPE_POLYLINE;
    }

    protected _write(coordinates: any, writer: ShpWriter): void {
        if (!_.isArray(coordinates[0][0])) {
            coordinates = [coordinates];
        }

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
}