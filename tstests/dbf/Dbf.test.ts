import _ from 'lodash';
import Dbf from '../../src/dbf/Dbf';
import DbfRecord from '../../src/dbf/DbfRecord';
import Optional from '../../src/base/Optional';

import dbf_usstates_header from '../data/dbf_usstates_header.json'
import dbf_usstates_record1 from '../data/dbf_usstates_record1.json'
import dbf_usstates_record2 from '../data/dbf_usstates_record2.json'
import dbf_usstates_record51 from '../data/dbf_usstates_record51.json'

describe('Dbf tests', () => {
    const filePath = './tests/data/USStates.dbf';

    test('read header test', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(() => {
            const header = dbf.__header;
            const actual = JSON.stringify(header.json());
            const expected = JSON.stringify(dbf_usstates_header);

            expect(actual).toEqual(expected);
        });
    });

    test('read record - first', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.iterator();
            const record = await records.next();

            const actualJson = JSON.stringify(record.value.json());
            const expectJson = JSON.stringify(dbf_usstates_record1)
            expect(actualJson).toBe(expectJson);
            expect(record.value.id).toBe(0);
        });
    });
    
    test('read record - second', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.iterator();
            await records.next();
            let record = await records.next();
            expect(JSON.stringify(record.value.json())).toBe(JSON.stringify(dbf_usstates_record2));
            expect(record.value.id).toBe(1);
        });
    });
    
    test('read record - final', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.iterator();
            let temp = await records.next();
            let record = new Optional<DbfRecord>(undefined);
            let count = 0;
            while (!records.done) {
                record = temp;
                count++;
                temp = await records.next();
            }
            
            expect(count).toBe(51);
            expect(JSON.stringify(record.value.json())).toBe(JSON.stringify(dbf_usstates_record51));
            expect(record.value.id).toBe(50);
        });
    });

    test('read record - by id', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.iterator();
            let record1 = await records.next();
            let count = 0;
            while (!records.done) {
                const record2 = await dbf.get(count); 
                expect(record2).toEqual(record1.value);
                expect(record2.id).toBe(count);

                count++;
                record1 = await records.next();
            }

            expect(count).toBe(51);
        });
    });

    test('read austin dbf - 1', async () => {
        const dbf = new Dbf('./tstests/data/Austinstreets.dbf');
        await dbf.openWith(async () => {
            const records = await dbf.records();
            expect(records.length).toBe(13843);
        });
    });

    test('read austin dbf - 2', async () => {
        const dbf = new Dbf('./tstests/data/Austinstreets.dbf');
        await dbf.openWith(async () => {
            const records = await dbf.iterator();
            let record1 = await records.next();
            let count = 0;
            while (!records.done) {
                const record2 = await dbf.get(count);

                if (count % 100 === 0) {
                    expect(record1.value).toStrictEqual(record2);
                }

                if (count === 500) break;

                count++;
                record1 = await records.next();
            }
        });
    });
});

describe('Dbf records test', () => {
    const filePath = './tstests/data/USStates.dbf';

    test('read test', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.records();
            expect(records.length).toBe(51);

            const it = await dbf.iterator();
            let record1 = await it.next();
            let count = 0;
            while (!it.done) {
                const record2 = records[count]; 
                expect(record2).toEqual(record1.value);
                expect(record2.id).toBe(count);

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
                expect(r.values.size).toBe(1);
                expect(r.values.has('RECID')).toBeTruthy();
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
            expect(record2).toEqual(record1.value);
        });
    });

    test('read test - limit + from', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.records({ limit: 2, from: 2 });
            expect(records.length).toBe(2);

            const it = await dbf.iterator();
            await it.next(); // 0
            let record1 = await it.next(); // 1
            
            record1 = await it.next(); // 2
            let record2 = records[0]; 
            expect(record2).toEqual(record1.value);
            
            record1 = await it.next(); // 3
            record2 = records[1]; 
            expect(record2).toEqual(record1.value);
        });
    });

    test('read test - limit + from + fields', async () => {
        const dbf = new Dbf(filePath);
        await dbf.openWith(async () => {
            const records = await dbf.records({ limit: 2, from: 2, fields: ['RECID'] });
            expect(records.length).toBe(2);

            records.forEach(r => {
                expect(r.values.size).toEqual(1);
                expect(r.values.has('RECID')).toBeTruthy();
            });
        });
    });
});


