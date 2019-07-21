import _ from 'lodash';
import Openable from './Openable';
import IEnvelope from '../shp/IEnvelope';

export default class StreamOpenable extends Openable {
    protected _getStreamOption(start?: number, end?: number): { autoClose: boolean, start?: number, end?: number } {
        return <{ autoClose: boolean, start?: number, end?: number }>_.pickBy({ autoClose: true, start, end }, i => !_.isUndefined(i));
    }

    protected _normalizeFilter(filter: { from?: number, limit?: number, fields?: string[], envelope?: IEnvelope } | null | undefined): { from: number, limit: number, fields?: string[], envelope?: IEnvelope } {
        filter = _.defaultTo(filter, { });
        filter = _.defaults(filter, { from: 0, limit: Number.MAX_SAFE_INTEGER });
        return <{ from: number, limit: number, fields?: string[], envelope?: IEnvelope }>filter;
    }
};