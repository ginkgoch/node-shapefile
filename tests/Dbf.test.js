const Dbf = require('../libs/dbf/Dbf');
const DbfFieldType = require('../libs/dbf/DbfFieldType');
const usstates_header = require('./data/USStates_header');

describe('Dbf tests', () => {
    const filePath = './tests/data/USStates.dbf';

    test('read header test', async () => {
        const dbf = new Dbf(filePath);
        await dbf.open();

        const header = dbf._header;
        expect(header).toEqual(usstates_header);
        await dbf.close();
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