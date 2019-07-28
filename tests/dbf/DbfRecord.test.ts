import { BufferWriter } from 'ginkgoch-buffer-io'
import DbfRecord from '../../src/dbf/DbfRecord'
import DbfField from '../../src/dbf/DbfField';
import { DbfFieldType } from '../../src/dbf/DbfFieldType';

describe('dbf record tests', () => {
    it('constructor - 1', () => {
        const record = new DbfRecord();
        expect(record.values.size).toBe(0);
        expect(record.id).toBe(-1);
    });

    it('constructor - 2', () => {
        const props = new Map<string, any>();
        props.set('RECID', 1);
        props.set('NAME', 'Micheal');

        const record = new DbfRecord(props);
        expect(record.values.size).toBe(2);
        expect(record.id).toBe(-1);
        expect(record.values.get('RECID')).toBe(1);
        expect(record.values.get('NAME')).toEqual('Micheal');
    });

    it('constructor - 3', () => {
        const record = new DbfRecord({ 'RECID':1, 'NAME': 'Micheal' });
        expect(record.values.size).toBe(2);
        expect(record.id).toBe(-1);
        expect(record.values.get('RECID')).toBe(1);
        expect(record.values.get('NAME')).toEqual('Micheal');
    });

    it('bool string length', () => {
        let buff = Buffer.from('F');
        expect(buff.length).toBe(1);
    });

    it('write bool value', () => {
        ['true', '1', 't', 'yes', 'y'].forEach(key => _testWriteBoolean(key, 'T'));
        [' ', '?'].forEach(key => _testWriteBoolean(key, '?'));
        ['F', 'FALSE', 'ABC'].forEach(key => _testWriteBoolean(key, 'F'));
    });

    it('write int value', () => {
        ['129', 418, 't', ''].forEach((v, k, arr) => {
            const buff = Buffer.alloc(4);
            const buffWr = new BufferWriter(buff);
            DbfRecord._writeIntegerValue(buffWr, v);

            const v1 = buff.readInt32LE(0);
            let exp = parseInt(v.toString());
            if (isNaN(exp)) {
                exp = 0;
            }
            expect(v1).toBe(exp);
        });
    });

    it('write NaN int value', () => {
        const buff = Buffer.alloc(4);
        const buffWr = new BufferWriter(buff);
        buffWr.writeInt32(NaN);
        const v = buff.readInt32LE(0);
        expect(v).toBe(0);
    });

    it('format date', () => {
        let date = new Date('2019-8-30');
        let formated = DbfRecord._formatDate(date);
        expect(formated).toBe('20190830');

        date = new Date('2019-6-2');
        formated = DbfRecord._formatDate(date);
        expect(formated).toBe('20190602');

        date = new Date('1900-12-23');
        formated = DbfRecord._formatDate(date);
        expect(formated).toBe('19001223');

        date = new Date('900-12-23');
        formated = DbfRecord._formatDate(date);
        expect(formated).toBe('09001223');
    });

    it('get number buffer', () => {
        let field = DbfField.fromJson({ length: 10, type: DbfFieldType.number, decimal: 2, name: 'REC' });

        let num = 2888900.435666;
        let outSrc = DbfRecord._getNumberBuffer(num, field);
        let outTar = outSrc.toString();
        expect(outTar).toBe('2888900.43');

        field = DbfField.fromJson({ length: 10, type: DbfFieldType.number, decimal: 2, name: 'REC' });
        num = 2888900;
        outSrc = DbfRecord._getNumberBuffer(num, field);
        outTar = outSrc.toString().replace(/\0/g, '').trim();
        expect(outTar).toBe('2888900');

        field = DbfField.fromJson({ length: 10, type: DbfFieldType.number, decimal: 1, name: 'REC' });
        num = 2888900.022;
        outSrc = DbfRecord._getNumberBuffer(num, field);
        outTar = outSrc.toString().replace(/\0/g, '').trim();
        expect(outTar).toBe('2888900.0');

        field = DbfField.fromJson({ length: 5, type: DbfFieldType.number, decimal: 1, name: 'REC' });
        num = 28889.022;
        expect(() => {
            outSrc = DbfRecord._getNumberBuffer(num, field);
        }).toThrow(new Error(`number length is larger than field length. value:${num}, field:${field.name}, length:${field.length}, decimal:${field.decimal}.`));
    });

    it('_pickFieldValues - 1', () => {
        let record = new DbfRecord();
        record.values.set('A', 1);
        record.values.set('B', 2);
        record.values.set('C', 3);
        
        DbfRecord._pickFieldValues(record, ['A']);
        expect(record.values.size).toBe(1);
        expect(record.values.get('A')).toBe(1);
    });

    it('_pickFieldValues - 2', () => {
        let record = new DbfRecord();
        record.values.set('A', 1);
        record.values.set('B', 2);
        record.values.set('C', 3);
        
        DbfRecord._pickFieldValues(record, undefined);
        expect(record.values.size).toBe(3);
        expect(record.values.get('A')).toBe(1);
    });

    it('_pickFieldValues - 3', () => {
        let record = new DbfRecord();
        record.values.set('A', 1);
        record.values.set('B', 2);
        record.values.set('C', 3);
        
        DbfRecord._pickFieldValues(record, ['A', 'B']);
        expect(record.values.size).toBe(2);
        expect(record.values.get('A')).toBe(1);
    });

    it('from json', () => {
        let json: any = {
            id: 34,
            values: { name: 'name1', rec: 'abc' },
            deleted: true
        }

        let record = DbfRecord.fromJson(json);
        expect(record.id).toBe(34);
        expect(record.deleted).toBe(true);
        expect(record.values.get('name')).toEqual('name1');
        expect(record.values.get('rec')).toEqual('abc');

        json = {
            values: { },
        }

        record = DbfRecord.fromJson(json);
        expect(record.id).toBe(-1);
        expect(record.deleted).toBe(false);
        expect(record.values.size).toBe(0);
    });
});

function _testWriteBoolean(key: string, expected: string) {
    const buff = Buffer.alloc(1);
    const buffWr = new BufferWriter(buff);
    DbfRecord._writeBooleanValue(buffWr, key);
    const v = buff.toString().replace('/\0/g', '').trim();
    expect(v).toBe(expected);
}