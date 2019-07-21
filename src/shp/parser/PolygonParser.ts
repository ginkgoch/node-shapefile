import GeomParser from "./GeomParser";
import { ShapefileType } from "../../shared/ShapefileType";


export default class PolygonParser extends GeomParser {
    get expectedType(): ShapefileType {
        return ShapefileType.polygon
    }  
    
    protected _readGeom(): any {
        const numParts = this.reader.nextInt32LE(); 
        const numPoints = this.reader.nextInt32LE(); 
        const parts = this.reader.nextParts(numParts); 
        const points = this.reader.nextPointsByParts(numPoints, parts); 
        return points;
    }
}