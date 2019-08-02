import _ from "lodash";
import { IEnvelope } from "ginkgoch-geom";
import IQueryFilter from "./IQueryFilter";

export default class FilterUtils {
    static normalizeFilter(filter: IQueryFilter | null | undefined, fetchAllFields?: () => string[]): { from: number, limit: number, fields?: string[], envelope?: IEnvelope } {
        filter = _.defaultTo(filter, {});
        filter = _.defaults(filter, { from: 1, limit: Number.MAX_SAFE_INTEGER });

        if (filter.from && filter.from < 1) {
            filter.from = 1;
        }

        if (fetchAllFields !== undefined) {
            filter.fields = FilterUtils.normalizeFields(filter.fields, fetchAllFields);
        }

        return <{ from: number, limit: number, fields?: string[], envelope?: IEnvelope }>filter;
    }

    static normalizeFields(fields?: 'all' | 'none' | string[], fetchAllFields?: () => string[]) {
        if (fields === 'none') {
            return [];
        }

        let allFields = new Array<string>();
        if (fetchAllFields !== undefined) {
            allFields = fetchAllFields();
        }

        if (_.isArray(fields)) {
            return _.intersection(allFields, fields);
        } else {
            return _.clone(allFields);
        }
    }
}