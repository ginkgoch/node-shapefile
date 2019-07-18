import StreamOpenable from '../../src/base/StreamOpenable';

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
});