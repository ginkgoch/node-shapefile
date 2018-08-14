const _ = require('lodash');
const Openable = require('./Openable');

module.exports = class StreamOpenable extends Openable {
    _getStreamOption(start, end) {
        return _.pickBy({ autoClose: true, start, end }, i => !_.isUndefined(i));
    }

    _normalizeFilter(filter) {
        filter = _.defaultTo(filter, { });
        filter = _.defaults(filter, { from: 0, limit: Number.MAX_SAFE_INTEGER, fields: undefined });
        return filter;
    }
}