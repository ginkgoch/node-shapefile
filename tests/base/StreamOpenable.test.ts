import StreamOpenable from '../../src/base/StreamOpenable';
import _ from 'lodash';

const defaultFilter = { from: 0, limit: Number.MAX_SAFE_INTEGER };

class TestStream extends StreamOpenable {
    normalizeFilter(filter: { from?: number, limit?: number } | null | undefined) {
        return this._normalizeFilter(filter);
    }

    getStreamOption(start?: number, end?: number) {
        return this._getStreamOption(start, end);
    }
}

describe('base.StreamOpenable', () => {
    it('normalizeFilter', () => {
        const s = new TestStream();
        let f = s.normalizeFilter(undefined);
        expect(f.from).toBe(0);
        expect(f.limit).toBe(Number.MAX_SAFE_INTEGER);

        f = s.normalizeFilter({ from: 20 });
        expect(f.from).toBe(20);
        expect(f.limit).toBe(Number.MAX_SAFE_INTEGER);

        f = s.normalizeFilter({ limit: 20 });
        expect(f.from).toBe(0);
        expect(f.limit).toBe(20);
    });

    it('getStreamOption', () => {
        const s = new TestStream();
        let opt = s.getStreamOption(20);
        expect(opt.autoClose).toBeTruthy();
        expect(opt.start).toBe(20);
        expect(opt.end).toBeUndefined();

        opt = s.getStreamOption(30, 50);
        expect(opt.autoClose).toBeTruthy();
        expect(opt.start).toBe(30);
        expect(opt.end).toBe(50);
    });

    test('filter normalize test', () => {
        const so = new TestStream();
        let expectedFilter = _.clone(defaultFilter);

        let filter = undefined;
        let r = so.normalizeFilter(filter);
        expect(r).toEqual(expectedFilter);

        testFilter({ from: 20 }, so);

        testFilter({ limit: 20 }, so);

        testFilter({ from: 15, limit: 20 }, so);

        testFilter({ fields: [] }, so);

        testFilter({ fields: ['RECID'] }, so);

        testFilter({ from: 10, limit: 20, fields: ['RECID'] }, so);
    }); 
});

function testFilter(filter: any, so: TestStream) {
    let expectedFilter = _.clone(defaultFilter);
    expectedFilter = _.assign(expectedFilter, filter);
    let r = so.normalizeFilter(filter);
    expect(r).toEqual(expectedFilter);
}