const Dbf = require('../libs/dbf/Dbf');
const DbfFieldType = require('../libs/dbf/DbfFieldType');
const dbf_usstates_header = require('./data/dbf_usstates_header.json');
const dbf_usstates_record1 = require('./data/dbf_usstates_record1.json');
const dbf_usstates_record2 = require('./data/dbf_usstates_record2.json');
const dbf_usstates_record51 = require('./data/dbf_usstates_record51.json');

describe('Dbf tests', () => {
    const filePath = './tests/data/USStates.dbf';

    test('read header test', async () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(() => {
            const header = dbf._header;
            expect(JSON.stringify(header)).toEqual(JSON.stringify(dbf_usstates_header));
        });
    });

    test('read record - first', async () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(async () => {
            const records = await dbf.readRecords();
            const record = await records.next();
            expect(JSON.stringify(record)).toBe(JSON.stringify(dbf_usstates_record1));
        });
    });

    test('read record - second', async () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(async () => {
            const records = await dbf.readRecords();
            let record = await records.next();
            record = await records.next();
            expect(JSON.stringify(record)).toBe(JSON.stringify(dbf_usstates_record2));
        });
    });

    test('read record - final', async () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(async () => {
            const records = await dbf.readRecords();
            let temp = await records.next();
            let record = undefined;
            let count = 0;
            while (!temp.done) {
                record = temp;
                count++;
                temp = await records.next();
            }

            expect(count).toBe(51);
            expect(JSON.stringify(record)).toBe(JSON.stringify(dbf_usstates_record51));
        });
    });
});

describe('Field type tests', () => {
    test('find field name test', () => {
        function _testLowerAndUpperCase(shortName, expected) {
            expect(DbfFieldType._getFieldTypeName(shortName.toLowerCase())).toEqual(expected);
            expect(DbfFieldType._getFieldTypeName(shortName.toUpperCase())).toEqual(expected);
        }

        _testLowerAndUpperCase('n', 'number');
        _testLowerAndUpperCase('c', 'character');
        _testLowerAndUpperCase('b', 'binary');
        _testLowerAndUpperCase('l', 'boolean');
        _testLowerAndUpperCase('d', 'date');
        _testLowerAndUpperCase('i', 'integer');
        _testLowerAndUpperCase('m', 'memo');
        _testLowerAndUpperCase('f', 'float');
    });
});