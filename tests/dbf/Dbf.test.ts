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

    test('read header test', () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(() => {
            const header = dbf.__header;
            const actual = JSON.stringify(header.json());
            const expected = JSON.stringify(dbf_usstates_header);

            expect(actual).toEqual(expected);
        });
    });

    test('read record - first', () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(() => {
            const records = dbf.iterator();
            const record = records.next();

            const actualJson = JSON.stringify(record.value.json());
            const expectJson = JSON.stringify(dbf_usstates_record1)
            expect(actualJson).toBe(expectJson);
            expect(record.value.id).toBe(1);
        });
    });
    
    test('read record - second', () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(() => {
            const records = dbf.iterator();
            records.next();
            let record = records.next();
            expect(JSON.stringify(record.value.json())).toBe(JSON.stringify(dbf_usstates_record2));
            expect(record.value.id).toBe(2);
        });
    });
    
    test('read record - final', () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(() => {
            const records = dbf.iterator();
            let temp = records.next();
            let record = new Optional<DbfRecord>(undefined);
            let count = 0;
            while (!records.done) {
                record = temp;
                count++;
                temp = records.next();
            }
            
            expect(count).toBe(51);
            expect(JSON.stringify(record.value.json())).toBe(JSON.stringify(dbf_usstates_record51));
            expect(record.value.id).toBe(51);
        });
    });

    test('read record - by id', () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(() => {
            const records = dbf.iterator();
            let record1 = records.next();
            let count = 1;
            while (!records.done) {
                const record2 = dbf.get(count); 
                expect(record2).toEqual(record1.value);
                expect(record2.id).toBe(count);

                count++;
                record1 = records.next();
            }

            count--;

            expect(count).toBe(51);
        });
    });

    test('read austin dbf - 1', () => {
        const dbf = new Dbf('./tests/data/Austinstreets.dbf');
        dbf.openWith(() => {
            const records = dbf.records();
            expect(records.length).toBe(13843);
        });
    });

    test('read austin dbf - 2', () => {
        const dbf = new Dbf('./tests/data/Austinstreets.dbf');
        dbf.openWith(() => {
            const records = dbf.iterator();
            let record1 = records.next();
            let count = 1;
            while (!records.done) {
                const record2 = dbf.get(count);

                if (count % 100 === 0) {
                    expect(record1.value).toStrictEqual(record2);
                }

                if (count === 500) break;

                count++;
                record1 = records.next();
            }
        });
    });
});

describe('Dbf records test', () => {
    const filePath = './tests/data/USStates.dbf';

    test('read test', () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(() => {
            const records = dbf.records();
            expect(records.length).toBe(51);

            const it = dbf.iterator();
            let record1 = it.next();
            let count = 1;
            while (!it.done) {
                const record2 = records[count - 1]; 
                expect(record2).toEqual(record1.value);
                expect(record2.id).toBe(count);

                count++;
                record1 = it.next();
            }
        });
    });

    test('read test - fields', () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(() => {
            const records = dbf.records({ fields: ['RECID'] });
            expect(records.length).toBe(51);

            records.forEach(r => {
                expect(r.values.size).toBe(1);
                expect(r.values.has('RECID')).toBeTruthy();
            });
        });
    });

    test('read test - limit', () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(() => {
            const records = dbf.records({ limit: 1 });
            expect(records.length).toBe(1);

            const it = dbf.iterator();
            let record1 = it.next();

            const record2 = records[0]; 
            expect(record2).toEqual(record1.value);
        });
    });

    test('read test - limit + from', () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(() => {
            const records = dbf.records({ limit: 2, from: 2 });
            expect(records.length).toBe(2);

            const it = dbf.iterator();
            it.next(); // 1
            let record1 = it.next(); // 2
            expect(records[0]).toEqual(record1.value);
            
            record1 = it.next(); // 2
            expect(records[1]).toEqual(record1.value);
        });
    });

    test('read test - limit + from + fields', () => {
        const dbf = new Dbf(filePath);
        dbf.openWith(() => {
            const records = dbf.records({ limit: 2, from: 2, fields: ['RECID'] });
            expect(records.length).toBe(2);

            records.forEach(r => {
                expect(r.values.size).toEqual(1);
                expect(r.values.has('RECID')).toBeTruthy();
            });
        });
    });
});


