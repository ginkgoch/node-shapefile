const _ = require('lodash');

module.exports = class Iteractor {
    async next() {

    }

    _done() {
        return { done: true };
    }

    _continue(obj) {
        obj.done = false;
        return obj;
    }
}