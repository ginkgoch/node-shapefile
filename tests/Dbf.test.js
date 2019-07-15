const fs = require('fs');
const _ = require('lodash');

const Dbf = require('../libs/dbf/Dbf');
const DbfFieldType = require('../libs/dbf/DbfFieldType');
const dbf_usstates_header = require('./data/dbf_usstates_header.json');
const dbf_usstates_record1 = require('./data/dbf_usstates_record1.json');
const dbf_usstates_record2 = require('./data/dbf_usstates_record2.json');
const dbf_usstates_record51 = require('./data/dbf_usstates_record51.json');
const dbf_create_fields = require('./data/dbf-create-fields.json');
const dbf_create_records = require('./data/dbf_create_records.json');

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
            await records.next();
            let record = await records.next();
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

    test('read austin dbf - 1', async () => {
        const dbf = new Dbf('./tests/data/Austinstreets.dbf');
        await dbf.openWith(async () => {
            const records = await dbf.records();
            expect(records.length).toBe(13843);
        });
    });

    test('read austin dbf - 2', async () => {
        const dbf = new Dbf('./tests/data/Austinstreets.dbf');
        await dbf.openWith(async () => {
            const records = await dbf.iterator();
            let record1 = await records.next();
            let count = 0;
            while (!record1.done) {
                const record2 = await dbf.get(count);

                if (count % 50 === 0) {
                    expect(record1.result).toStrictEqual(record2);
                }

                count++;
                record1 = await records.next();
            }

            expect(count).toBe(13843);
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
                expect(_.keys(r.values).length).toEqual(1);
                expect(_.keys(r.values)).toEqual(['RECID']);
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
                expect(_.keys(r.values).length).toEqual(1);
                expect(_.keys(r.values)).toEqual(['RECID']);
            });
        });
    });
});

describe('create dbf', () => {
    const filePathSrc = './tests/data/USStates.dbf';

    it('create empty', async () => {
        const filePathTgt = './tests/data/USStates_create_test.dbf';
        const dbfSrc = new Dbf(filePathSrc);
        await dbfSrc.open();

        const fieldsSrc = dbfSrc.fields(true);
        const dbfTgt = Dbf.createEmptyDbf(filePathTgt, fieldsSrc);
        await dbfTgt.open();

        expect(dbfTgt._header.fields.length).not.toBe(0);
        expect(dbfTgt._header.fields).toStrictEqual(dbfSrc._header.fields);

        fs.unlinkSync(filePathTgt);
    });

    it('create dbf with records', async () => {
        const filePath = './tests/data/USStates_create_test1.dbf';
        const dbf = Dbf.createEmptyDbf(filePath, dbf_create_fields);
        await dbf.open();

        dbf.pushRows(dbf_create_records);
        dbf.flush();
        dbf.close();

        const dbfNew = new Dbf(filePath);
        await dbfNew.open();

        const records = await dbfNew.records();
        expect(records.length).toBe(51);

        // fs.unlinkSync(filePath);
    });

    it('create dbf with records 1', async () => {
        const filePath1 = './tests/data/USStates_create_test1.dbf';
        const filePath2 = './tests/data/USStates.dbf';

        const dbf1 = new Dbf(filePath1);
        await dbf1.open();

        const dbf2 = new Dbf(filePath2);
        await dbf2.open();

        let buffer1 = fs.readFileSync(filePath1);
        let buffer2 = fs.readFileSync(filePath2);

        let length = buffer1.length;
        let offset = 1697;
        let seg = 467;

        while(offset < length - 1) {
            let segBuff1 = buffer1.slice(offset, offset + seg);
            let segBuff2 = buffer2.slice(offset, offset + seg);
            if (!segBuff1.equals(segBuff2)) {
                break;
            }
            offset += seg;
        }
    });
});

