import MultiPointParser from "./MultiPointParser";
import PointParser from "./PointParser";
import PolygonParser from "./PolygonParser";
import PolyLineParser from "./PolyLineParser";
import GeomParser from "./GeomParser";

// export {
//     PointParser as point,
//     MultiPointParser as multiPoint,
//     PolyLineParser as polyLine,
//     PolygonParser as polygon
// }

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