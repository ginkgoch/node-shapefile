import GeomParser from "./GeomParser";
import { ShapefileType } from "../../shared/ShapefileType";
import constants from '../../shared/Constants';

export default class PolygonParser extends GeomParser {
    get expectedType(): ShapefileType {
        return ShapefileType.polygon
    }  
    
    protected _readGeom(): any {
        const numParts = this._reader.nextInt32LE(); 
        const numPoints = this._reader.nextInt32LE(); 
        const parts = this._reader.nextParts(numParts); 
        const points = this._reader.nextPointsByParts(numPoints, parts); 
        return points;
    }

    get expectedTypeName(): string {
        return constants.GEOM_TYPE_POLYGON;
    }
}