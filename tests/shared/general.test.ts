import { BufferReader } from 'ginkgoch-buffer-io';
import { ShapefileType } from '../../src/shared';
import EnumUtils from '../../src/shared/EnumUtils';

describe('general', () => {
    it('import.module', () => {
        const br = new BufferReader(Buffer.alloc(20));
        expect(br).not.toBeNull();
    });

    it('enum to name', () => {
        const item = ShapefileType.polyLine;

        expect(item).toBe(3);

        let name = EnumUtils.getName<ShapefileType>(ShapefileType.polyLine, ShapefileType);
        expect(name).toBe('polyLine');
    })
});