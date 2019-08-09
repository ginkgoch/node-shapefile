import fs from 'fs';
import Dbf from '../../src/dbf/Dbf';
import * as Utils from '../utils/Utils';
import DbfField from '../../src/dbf/DbfField';
import { DbfFieldType } from '../../src/dbf/DbfFieldType';

describe('Dbf field edit', () => {
    it('add field test', () => {
        prepare('USStates', 'Add', target => {
            const dbfFile = new Dbf(target, 'rs+');
            dbfFile.open();
            const oldFields = dbfFile.__header.fields;
            dbfFile.pushField(new DbfField('ABC', DbfFieldType.character));
            dbfFile.flushFields();

            const newFields = dbfFile.__header.fields;
            expect(newFields.length).toBe(oldFields.length + 1);
            expect(newFields.map(f => f.name)).toContainEqual('ABC');
        });
    });

    it('delete field test', () => {
        prepare('USStates', 'Delete', target => {
            const dbfFile = new Dbf(target, 'rs+');
            dbfFile.open();
            const oldFields = dbfFile.__header.fields;
            dbfFile.removeField('STATE_ID');
            dbfFile.flushFields();

            const newFields = dbfFile.__header.fields;
            expect(newFields.length).toBe(oldFields.length - 1);
            expect(newFields.map(f => f.name)).not.toContainEqual('STATE_ID');
        });
    });

    it('update field test', () => {
        prepare('USStates', 'Update', target => {
            const dbfFile = new Dbf(target, 'rs+');
            dbfFile.open();
            const oldFields = dbfFile.__header.fields;
            dbfFile.updateField('STATE_ID', new DbfField('STATE_IQ', DbfFieldType.number));
            dbfFile.flushFields();

            const newFields = dbfFile.__header.fields;
            expect(newFields.length).toBe(oldFields.length);
            expect(newFields.map(f => f.name)).not.toContainEqual('STATE_ID');
            expect(newFields.map(f => f.name)).toContainEqual('STATE_IQ');
        });
    });
});

function prepare(srcName: string, action: string, func: (target: string) => void) {
    const sourceDbfPath = Utils.resolvePath(srcName, '.dbf');
    const targetDbfPath = Utils.resolvePath(`${ srcName }-${ action }`, '.dbf');
    try {
        fs.copyFileSync(sourceDbfPath, targetDbfPath);
        func(targetDbfPath);
    } 
    finally {
        if (fs.existsSync(targetDbfPath)) {
            fs.unlinkSync(targetDbfPath);
        }
    }
}