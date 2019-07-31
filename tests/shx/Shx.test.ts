import fs from 'fs';
import Shx from '../../src/shx/Shx';
import ShxRecord from '../../src/shx/ShxRecord';

describe('shx tests', () => {
    const filePath = './tests/data/USStates.shx';

    test('get record count test', async () => {
        const shx = new Shx(filePath);
        await shx.openWith(() => {
            const count = shx.count();
            expect(count).toBe(51);
        });
    });

    test('read record test', async () => {
        const shx = new Shx(filePath);
        await shx.openWith(() => {
            const count = shx.count();
            let previousRec = shx.get(1);
            for(let i = 2; i <= count; i++) {
                const currentRec = shx.get(i);
                expect(currentRec.offset).toBe(previousRec.offset + previousRec.length + 8);
                previousRec = currentRec;
            }
        });
    });

    test('remove record test', async () => {
        const filePathToDelete = './tests/data/USStates_delete_test.shx';
        fs.copyFileSync(filePath, filePathToDelete);

        const shx = new Shx(filePathToDelete, 'rs+');
        await shx.openWith(() => {
            try {
                const count = shx.count();
                expect(count).toBe(51);

                const id = 30;
                shx.removeAt(id);
                const record = shx.get(id);
                expect(record.length).toBe(0);
            } finally {
                fs.unlinkSync(filePathToDelete);
            }
        });
    });

    test('updateAt', async () => {
        const filePathToDelete = './tests/data/USStates_update_test.shx';
        fs.copyFileSync(filePath, filePathToDelete);

        const shx = new Shx(filePathToDelete, 'rs+');
        await shx.openWith(() => {
            try {
                const id = 30, offset = 356, length = 488;
                
                shx.updateAt(id, offset, length);

                const record = shx.get(id);
                expect(record.offset).toBe(offset);
                expect(record.length).toBe(length);
            } finally {
                fs.unlinkSync(filePathToDelete);
            }
        });
    });

    it('records - 1', async () => {
        const shx = new Shx(filePath, 'rs');
        await shx.open();

        const records = await shx.records();
        expect(records.length).toBe(51);
        expect(records[0].id).toBe(1);
        expect(records[records.length - 1].id).toBe(51);
        expect(records[records.length - 1].length).not.toBe(0);
        await shx.close();
    });

    it('records - 2', async () => {
        const shx = new Shx(filePath, 'rs');
        await shx.open();

        const records = await shx.records({ from: 20, limit: 10 });
        expect(records.length).toBe(10);
        expect(records[0].id).toBe(20);
        expect(records[records.length - 1].id).toBe(29);
        expect(records[records.length - 1].length).not.toBe(0);
        await shx.close();
    });

    it('iterator', async () => {
        const shx = new Shx(filePath, 'rs');
        await shx.open();
        const it = await shx.iterator();

        const records = new Array<ShxRecord>();
        while(!it.done) {
            const record = await it.next();
            if (record.hasValue && record.value.length !== 0) {
                records.push(record.value);
            }
        }

        expect(records.length).toBe(51);
        for (let i = 0; i < records.length; i++) {
            expect(records[i].id).toBe(i + 1);
        }
    });
});