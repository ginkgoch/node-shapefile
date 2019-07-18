import Iterator from '../../src/base/Iterator';

describe('base.Iterator', () => {
    it('implementation', async () => {
        const t = new TestArray();
        const r = await t.next();
        expect(r.done).toBeFalsy();
        expect(r.result).toBe('continue...');
    });
});

class TestArray extends Iterator<string> {
    async next() {
        return this._continue('continue...')
    }
}