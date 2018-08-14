const _ = require('lodash');
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
        await dbf.openWith(() => {
            const header = dbf._header;
            expect(JSON.stringify(header)).toEqual(JSON.stringify(dbf_usstates_header));
        });
    });

    test('read record - first', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.iterator();
            const record = await records.next();
            expect(JSON.stringify(record)).toBe(JSON.stringify(dbf_usstates_record1));
        });
    });
    
    test('read record - second', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.iterator();
            let record = await records.next();
            record = await records.next();
            expect(JSON.stringify(record)).toBe(JSON.stringify(dbf_usstates_record2));
        });
    });
    
    test('read record - final', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.iterator();
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

    test('read record - by id', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.iterator();
            let record1 = await records.next();
            let count = 0;
            while (!record1.done) {
                const record2 = await dbf.get(count); 
                expect(record2).toEqual(record1.result);

                count++;
                record1 = await records.next();
            }

            expect(count).toBe(51);
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

describe('Dbf records test', () => {
    const filePath = './tests/data/USStates.dbf';

    test('read test', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.records();
            expect(records.length).toBe(51);

            const it = await dbf.iterator();
            let record1 = await it.next();
            let count = 0;
            while (!record1.done) {
                const record2 = records[count]; 
                expect(record2).toEqual(record1.result);

                count++;
                record1 = await it.next();
            }
        });
    });

    test('read test - fields', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.records({ fields: ['RECID'] });
            expect(records.length).toBe(51);

            records.forEach(r => {
                expect(_.keys(r).length).toEqual(1);
                expect(_.keys(r)).toEqual(['RECID']);
            });
        });
    });

    test('read test - limit', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.records({ limit: 1 });
            expect(records.length).toBe(1);

            const it = await dbf.iterator();
            let record1 = await it.next();

            const record2 = records[0]; 
            expect(record2).toEqual(record1.result);
        });
    });

    test('read test - limit + from', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.records({ limit: 2, from: 2 });
            expect(records.length).toBe(2);

            const it = await dbf.iterator();
            let record1 = await it.next(); // 0
            record1 = await it.next(); // 1
            
            record1 = await it.next(); // 2
            let record2 = records[0]; 
            expect(record2).toEqual(record1.result);
            
            record1 = await it.next(); // 3
            record2 = records[1]; 
            expect(record2).toEqual(record1.result);
        });
    });

    test('read test - limit + from + fields', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.records({ limit: 2, from: 2, fields: ['RECID'] });
            expect(records.length).toBe(2);

            records.forEach(r => {
                expect(_.keys(r).length).toEqual(1);
                expect(_.keys(r)).toEqual(['RECID']);
            });
        });
    });
})