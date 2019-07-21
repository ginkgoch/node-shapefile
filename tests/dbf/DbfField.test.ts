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

    it('fromJson', () => {
        let field = DbfField.fromJson({})
        expect(field.name).toEqual('')
        expect(field.type).toEqual(DbfFieldType.character)
        expect(field.length).toEqual(10)
        expect(field.decimal).toEqual(0)

        field = DbfField.fromJson({name: 'REC_ID'})
        expect(field.name).toEqual('REC_ID')
        expect(field.type).toEqual(DbfFieldType.character)
        expect(field.length).toEqual(10)
        expect(field.decimal).toEqual(0)

        field = DbfField.fromJson({type: DbfFieldType.number})
        expect(field.name).toEqual('')
        expect(field.type).toEqual(DbfFieldType.number)
        expect(field.length).toEqual(8)
        expect(field.decimal).toEqual(0)
    })
})