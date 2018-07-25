const _ = require('lodash');

module.exports = {
    number: 'N',
    character: 'C',
    binary: 'B',
    boolean: 'L',
    date: 'D',
    integer: 'I',
    memo: 'M',
    float: 'F',

    _getFieldTypeName: function(c) {
        return _.findKey(this, v => v.toUpperCase() === c.toUpperCase());
    }
};