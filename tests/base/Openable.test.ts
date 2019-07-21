import Openable from '../../src/base/Openable';

class TestOpener extends Openable { }

describe('base.Openable', () => {
    it('constructor', async () => {
        const t = new TestOpener();
        expect(t.isOpened).toBeFalsy();
        
        await t.open();
        expect(t.isOpened).toBeTruthy();
        
        await t.close();
        expect(t.isOpened).toBeFalsy();

        await t.openWith(() => {
            expect(t.isOpened).toBeTruthy();
        });

        expect(t.isOpened).toBeFalsy();
    });
})