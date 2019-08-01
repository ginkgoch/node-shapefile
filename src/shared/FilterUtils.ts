import _ from "lodash";
import { IEnvelope } from "ginkgoch-geom";
import IQueryFilter from "./IQueryFilter";

export default class FilterUtils {
    static normalize(filter: IQueryFilter | null | undefined): {from: number, limit: number, fields?: string[], envelope?: IEnvelope} {
        filter = _.defaultTo(filter, { });
        filter = _.defaults(filter, { from: 1, limit: Number.MAX_SAFE_INTEGER });

        if (filter.from && filter.from < 1) {
            filter.from = 1;
        }

        return <{from: number, limit: number, fields?: string[], envelope?: IEnvelope}>filter;
    }
}