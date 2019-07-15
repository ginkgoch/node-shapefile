const _ = require('lodash');

module.exports = class Iterator {
    async next() { }

    _done() {
        return { done: true };
    }

    _continue(obj) {
        return { done: false, result: obj };
    }
};