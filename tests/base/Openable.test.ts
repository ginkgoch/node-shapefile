import Openable from '../../src/base/Openable';

class TestOpener extends Openable { }

describe('base.Openable', () => {
    it('constructor', () => {
        const t = new TestOpener();
        expect(t.isOpened).toBeFalsy();
        
        t.open();
        expect(t.isOpened).toBeTruthy();
        
        t.close();
        expect(t.isOpened).toBeFalsy();

        t.openWith(() => {
            expect(t.isOpened).toBeTruthy();
        });

        expect(t.isOpened).toBeFalsy();
    });
})