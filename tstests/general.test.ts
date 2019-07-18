import { BufferReader } from 'ginkgoch-buffer-io';

describe('general', () => {
    it('import.module', () => {
        const br = new BufferReader(Buffer.alloc(20));
        expect(br).not.toBeNull();
    });
});