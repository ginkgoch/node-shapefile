const _ = require('lodash');
const Openable = require('./Openable');

module.exports = class StreamOpenable extends Openable {
    _getStreamOption(start, end) {
        return _.pickBy({ autoClose: true, start, end }, i => !_.isUndefined(i));
    }
}