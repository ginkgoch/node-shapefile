// const { BufferWriter } = require('ginkgoch-buffer-io');
// const DbfRecord = require('../libs/dbf/DbfRecord');

import {BufferWriter} from 'ginkgoch-buffer-io'
import DbfRecord from '../../src/dbf/DbfRecord'

describe('dbf record tests', () => {
   it('bool string length', () => {
      let buff = Buffer.from('F');
      expect(buff.length).toBe(1);
   });

   it('write bool value', () => {
       ['true', '1', 't', 'yes', 'y'].forEach(key => _testWriteBoolean(key,'T'));
       [' ', '?'].forEach(key => _testWriteBoolean(key,'?'));
       ['F', 'FALSE', 'ABC'].forEach(key => _testWriteBoolean(key,'F'));
   });

    it('write int value', () => {
        ['129', 418, 't', ''].forEach(key => {
            const buff = Buffer.alloc(4);
            const buffWr = new BufferWriter(buff);
            DbfRecord._writeIntegerValue(buffWr, key);

            const v = buff.readInt32LE(0);
            let exp = parseInt(key);
            if(isNaN(exp)) {
                exp = 0;
            }
            expect(v).toBe(exp);
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
        let field = { length: 10, type: 'N', decimal: 2, name: 'REC' };
        let num = 2888900.435666;
        let outSrc = DbfRecord._getNumberBuffer(num, field);
        let outTar = outSrc.toString();
        expect(outTar).toBe('2888900.43');

        field = { length: 10, type: 'N', decimal: 2, name: 'REC' };
        num = 2888900;
        outSrc = DbfRecord._getNumberBuffer(num, field);
        outTar = outSrc.toString().replace(/\0/g, '').trim();
        expect(outTar).toBe('2888900');

        field = { length: 10, type: 'N', decimal: 1, name: 'REC' };
        num = 2888900.022;
        outSrc = DbfRecord._getNumberBuffer(num, field);
        outTar = outSrc.toString().replace(/\0/g, '').trim();
        expect(outTar).toBe('2888900.0');

        field = { length: 5, type: 'N', decimal: 1, name: 'REC' };
        num = 28889.022;
        expect(() => {
            outSrc = DbfRecord._getNumberBuffer(num, field);
        }).toThrow(new Error(`number length is larger than field length. value:${num}, field:${field.name}, length:${field.length}, decimal:${field.decimal}.`));
    });
});

function _testWriteBoolean(key, expected) {
    const buff = Buffer.alloc(1);
    const buffWr = new BufferWriter(buff);
    DbfRecord._writeBooleanValue(buffWr, key);
    const v = buff.toString().replace('/\0/g', '').trim();
    expect(v).toBe(expected);
}