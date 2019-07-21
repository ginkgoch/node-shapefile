import fs from 'fs';
import Dbf from "../../src/dbf/Dbf";
import DbfField from "../../src/dbf/DbfField";
import DbfRecord from '../../src/dbf/DbfRecord';

import dbf_create_fields from '../data/dbf_create_fields.json'
import dbf_create_records from '../data/dbf_create_records.json'
import dbf_update_record from '../data/dbf_update_record.json'

describe('create dbf', () => {
    const filePathSrc = './tests/data/USStates.dbf';

    it('create empty', async () => {
        const filePathTgt = './tests/data/USStates_create_test.dbf';
        const dbfSrc = new Dbf(filePathSrc);
        await dbfSrc.open();

        const fieldsSrc = <DbfField[]>dbfSrc.fields(true);
        const dbfTgt = Dbf.createEmptyDbf(filePathTgt, fieldsSrc);

        try {
            await dbfTgt.openWith(async () => {
                expect(dbfTgt.__header.fields.length).not.toBe(0);
                expect(dbfTgt.__header.fields).toStrictEqual(dbfSrc.__header.fields);
            });
        } finally {
            fs.unlinkSync(filePathTgt);
        }
    });

    it('create dbf with records', async () => {
        const filePath = './tests/data/USStates_create_test1.dbf';

        try {
            const dbf = Dbf.createEmptyDbf(filePath, dbf_create_fields.map(f => DbfField.fromJson(f)));
            await dbf.open();

            dbf.pushRows(dbf_create_records.map(r => DbfRecord.fromJson({values: r})));
            dbf.flush();
            dbf.close();

            const dbfNew = new Dbf(filePath);
            await dbfNew.open();

            const records = await dbfNew.records();
            expect(records.length).toBe(51);

            await _compare('./tests/data/USStates.dbf', filePath);
        }
        finally {
            fs.unlinkSync(filePath);
        }
    });
});

async function _compare (filePath1: string, filePath2: string) {
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
}


describe('dbf deletion test', () => {
    const dbfPathSrc = './tests/data/MajorCities.dbf';
    it('deleteAt', async () => {
        const dbfPath = './tests/data/MajorCities_delete_1.dbf';
        try {
            fs.copyFileSync(dbfPathSrc, dbfPath);

            const dbf = new Dbf(dbfPath, 'rs+');
            await dbf.open();

            const idToRemove = 20;
            dbf.removeAt(idToRemove);
            let r = await dbf.get(idToRemove);

            expect(r.id).toBe(20);
            expect(r.deleted).toBeTruthy();

            dbf.recoverAt(idToRemove);
            r = await dbf.get(idToRemove);
            expect(r.id).toBe(20);
            expect(r.deleted).toBeFalsy();
        } catch (err) {
            console.log(err);
            expect(true).toBeFalsy();
        } finally {
            fs.unlinkSync(dbfPath);
        }
    });
});

describe('dbf update test', () => {
    const dbfPathSrc = './tests/data/MajorCities.dbf';
    it('deleteAt', async () => {
        const dbfPath = './tests/data/MajorCities_update_1.dbf';
        try {
            fs.copyFileSync(dbfPathSrc, dbfPath);

            const dbf = new Dbf(dbfPath, 'rs+');
            await dbf.open();

            const idToUpdate = 20;
            let record = await dbf.get(idToUpdate);
            expect(record.values.get('CAPITAL')).toBe('N');
            expect(record.values.get('PLACEFIP')).toBe('65000');

            dbf.updateRow(DbfRecord.fromJson(dbf_update_record));
            dbf.flush();

            record = await dbf.get(idToUpdate);
            expect(record.values.get('CAPITAL')).toBe('Y');
            expect(record.values.get('PLACEFIP')).toBe('66000');
        } catch (err) {
            expect(err).toBeNull();
        } finally {
            fs.unlinkSync(dbfPath);
        }
    });
});
