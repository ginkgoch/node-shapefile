import GeomParser from "./GeomParser";
import { ShapefileType } from "../../shared/ShapefileType";
import _ from "lodash";

export default class PolyLineParser extends GeomParser {
    get expectedType(): ShapefileType {
        return ShapefileType.polyLine;
    }  
    
    protected _readGeom(): any {
        const numParts = this.reader.nextInt32LE(); 
        const numPoints = this.reader.nextInt32LE(); 
        const parts = _.range(numParts).map(i => this.reader.nextInt32LE());
        let points: any = this.reader.nextPointsByParts(numPoints, parts); 

        if (points.length === 1) {
            points = _.first(points);
        }

        return points;
    }
}