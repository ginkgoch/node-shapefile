import { IEnvelope } from "ginkgoch-geom";

export default interface IQueryFilter {
    from?: number;
    limit?: number; 
    fields?: string[];
    envelope?: IEnvelope;
}