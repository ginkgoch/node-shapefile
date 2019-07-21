import IEnvelope from "../shp/IEnvelope";

export default interface IQueryFilter {
    from?: number;
    limit?: number; 
    fields?: string[];
    envelope?: IEnvelope;
}