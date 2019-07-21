import _ from "lodash";
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
}