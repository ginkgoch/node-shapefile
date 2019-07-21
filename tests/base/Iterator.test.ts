import Iterator from '../../src/base/Iterator';

describe('base.Iterator', () => {
    it('implementation', async () => {
        const t = new TestArray();
        const r = await t.next();
        expect(t.done).toBeFalsy();
        expect(r.value).toBe('continue...');
    });
});

class TestArray extends Iterator<string> {
    async next() {
        return this._continue('continue...')
    }
}