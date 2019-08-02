import Iterator from '../../src/base/Iterator';

describe('base.Iterator', () => {
    it('implementation', () => {
        const t = new TestArray();
        const r = t.next();
        expect(t.done).toBeFalsy();
        expect(r.value).toBe('continue...');
    });
});

class TestArray extends Iterator<string> {
    next() {
        return this._continue('continue...')
    }
}