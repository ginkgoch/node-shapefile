// const fs = require('fs');
// const DbfFieldType = require('../libs/dbf/DbfFieldType');
// const DbfHeader = require('../libs/dbf/DbfHeader');

import fs from 'fs'
import { DbfFieldType } from '../../src/dbf/DbfFieldType'
import DbfHeader from '../../src/dbf/DbfHeader'
import DbfField from '../../src/dbf/DbfField';

describe('DbfHeader tests', () => {
    const filePath = './tests/data/USStates.dbf';

    test('read header test', async () => {
        const _fd = fs.openSync(filePath, 'rs');
        const header = new DbfHeader();
        header.read(_fd);

        expect(header.fields.length).not.toBe(0)
    });

    test('test chunk field name buffer', () => {
        // length equal to 10
        let fieldName = 'HelloWorld';
        let buffer1 = DbfHeader._chunkFieldNameBuffer(fieldName);
        expect(buffer1.length).toBe(11);

        let fieldName1 = buffer1.toString();
        expect(fieldName1).toBe(fieldName + '\0');

        // length less than 10
        fieldName = 'Hello';
        buffer1 = DbfHeader._chunkFieldNameBuffer(fieldName);
        expect(buffer1.length).toBe(11);

        fieldName1 = buffer1.toString().replace(/\0/g, '').trim();
        expect(fieldName1).toBe(fieldName);


        // length less than 10
        fieldName = 'HelloWorldHelloWorld';
        buffer1 = DbfHeader._chunkFieldNameBuffer(fieldName);
        expect(buffer1.length).toBe(11);

        fieldName1 = buffer1.toString().replace(/\0/g, '').trim();
        expect(fieldName1).toBe('HelloWorldH')
    });

    test('char and buffer conversion', () => {
        let c = String.fromCharCode(66);
        let cc = c.charCodeAt(0);
        expect(cc).toBe(66)
    });

    test('write header', () => {
        const header = new DbfHeader();
        header.fileType = 3;
        header.year = 2019;
        header.month = 2;
        header.day = 6;
        header.recordCount = 51;
        header.headerLength = 64;
        header.recordLength = 467;
        header.fields.push(new DbfField('AREA', DbfFieldType.number, 12, 3));

        const filePath = './test_header_writer.dbf';
        let _fd = fs.openSync(filePath, 'w+');
        header.write(_fd);
        fs.closeSync(_fd);

        _fd = fs.openSync(filePath, 'rs');
        const header1 = new DbfHeader();
        header1.read(_fd);
        fs.closeSync(_fd);

        expect(header1).toStrictEqual(header);

        fs.unlinkSync(filePath)
    });

    test('init header', () => {
        const fields = [
            { name: 'REC', length: 10,  type: DbfFieldType.character, decimal: 0},
            { name: 'POP', length: 4,  type: DbfFieldType.integer, decimal: 0}
        ].map(json => DbfField.fromJson(json));
        
        const header = DbfHeader.createEmptyHeader(fields);

        const today = new Date();
        expect(header.year).toBe(today.getFullYear());
        expect(header.month).toBe(today.getMonth() + 1);
        expect(header.day).toBe(today.getDate());
        expect(header.fields.length).toBe(2);
        expect(header.recordCount).toBe(0);
        expect(header.recordLength).toBe(15);
        expect(header.headerLength).toBe(97);
    });

    test('get dbf field type', () => {
        let str = 'C';
        let fieldType = DbfHeader._getFieldType(str);
        expect(fieldType).toBe(DbfFieldType.character);
    });
});