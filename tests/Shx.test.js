const Shx = require('../libs/shx/Shx');

describe('shx tests', () => {
    const filePath = './tests/data/USStates.shx';

    test('get record count test', async () => {
        const shx = new Shx(filePath);
        await shx.openWith(() => {
            const count = shx.getCount();
            expect(count).toBe(51);
        });
    });

    test('read record test', async () => {
        const shx = new Shx(filePath);
        await shx.openWith(() => {
            const count = shx.getCount();
            let previousRec = shx.get(0);
            for(let i = 1; i < count; i++) {
                const currentRec = shx.get(i);
                expect(currentRec.offset).toBe(previousRec.offset + previousRec.length + 8);
                previousRec = currentRec;
            }
        });
    });
});