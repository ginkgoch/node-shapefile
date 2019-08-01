import _ from 'lodash';
import Openable from './Openable';
import IQueryFilter from '../shared/IQueryFilter';
import { IEnvelope } from "ginkgoch-geom";

export default class StreamOpenable extends Openable {
    _getStreamOption(start?: number, end?: number): { autoClose: boolean, start?: number, end?: number } {
        return <{ autoClose: boolean, start?: number, end?: number }>_.pickBy({ autoClose: true, start, end }, i => !_.isUndefined(i));
    }

    _normalizeFilter(filter: IQueryFilter | null | undefined): {from: number, limit: number, fields?: string[], envelope?: IEnvelope} {
        filter = _.defaultTo(filter, { });
        filter = _.defaults(filter, { from: 1, limit: Number.MAX_SAFE_INTEGER });
        return <{from: number, limit: number, fields?: string[], envelope?: IEnvelope}>filter;
    }
};