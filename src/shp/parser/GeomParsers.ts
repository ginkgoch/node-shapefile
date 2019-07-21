import GeomParser from "./GeomParser";
import PointParser from "./PointParser";
import PolygonParser from "./PolygonParser";
import PolyLineParser from "./PolyLineParser";
import MultiPointParser from "./MultiPointParser";

export const point = function(): GeomParser {
    return new PointParser();
}

export const multiPoint = function(): GeomParser {
    return new MultiPointParser();
}

export const polyLine = function(): GeomParser {
    return new PolyLineParser();
}

export const polygon = function(): GeomParser {
    return new PolygonParser();
}