const _ = require('lodash');
const StreamOpenable = require('../libs/base/StreamOpenable');
const defaultFilter = { from: 0, limit: Number.MAX_SAFE_INTEGER, fields: undefined };

describe('StreamOpenable tests', () => {

    test('filter normalize test', () => {
        const so = new StreamOpenable();
        let expectedFilter = _.clone(defaultFilter);

        let filter = undefined;
        let r = so._normalizeReadFilter(filter);
        expect(r).toEqual(expectedFilter);

        testFilter({ from: 20 }, so);

        testFilter({ limit: 20 }, so);

        testFilter({ from: 15, limit: 20 }, so);

        testFilter({ fields: [] }, so);

        testFilter({ fields: ['RECID'] }, so);

        testFilter({ from: 10, limit: 20, fields: ['RECID'] }, so);
    }); 
});

function testFilter(filter, so) {
    let expectedFilter = _.clone(defaultFilter);
    expectedFilter = _.assign(expectedFilter, filter);
    let r = so._normalizeReadFilter(filter);
    expect(r).toEqual(expectedFilter);
}