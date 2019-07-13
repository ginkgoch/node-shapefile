const fs = require('fs');
const DbfHeader = require('../libs/dbf/DbfHeader');

describe('DbfHeader tests', () => {
    const filePath = './tests/data/USStates.dbf';

    test('read header test', async () => {
        const _fd = fs.openSync(filePath, 'rs');
        const header = new DbfHeader();
        header.read(_fd);

        expect(header.fields.length).not.toBe(0)
    });

    test('test chunk field name buffer', () => {
        const header = new DbfHeader();

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
        header.year = 105;
        header.month = 2;
        header.day = 6;
        header.recordCount = 51;
        header.headerLength = 64;
        header.recordLength = 467;
        header.fields.push({name: 'AREA', type: 'N', length: 12, decimal: 3});

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
    })
});