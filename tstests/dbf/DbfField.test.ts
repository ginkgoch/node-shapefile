import DbfField from '../../src/dbf/DbfField'
import { DbfFieldType } from '../../src/dbf/DbfFieldType';

describe('DbfField', () => {
    it('clone', () => {
        let field1 = new DbfField('REC_ID', DbfFieldType.character, 10, 0);
        let field2 = field1.cloneDeep();

        expect(field2).toEqual(field2);

        field2.length = 6;
        expect(field2).not.toEqual(field1);

    })
})